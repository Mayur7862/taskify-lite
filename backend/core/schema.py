from django.utils.text import slugify
import graphene
from graphene_django import DjangoObjectType
from .models import Organization, Project, Task, TaskComment


class OrganizationType(DjangoObjectType):
    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "contact_email", "created_at")


class ProjectType(DjangoObjectType):
    task_count = graphene.Int()
    completed_tasks = graphene.Int()

    class Meta:
        model = Project
        fields = ("id", "name", "description", "status", "due_date", "created_at")

    def resolve_task_count(self, info):
        return self.tasks.count()

    def resolve_completed_tasks(self, info):
        return self.tasks.filter(status="DONE").count()


class TaskCommentType(DjangoObjectType):
    class Meta:
        model = TaskComment
        fields = ("id", "content", "author_email", "created_at")


class TaskType(DjangoObjectType):
    comments = graphene.List(TaskCommentType)

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "status",
            "assignee_email",
            "due_date",
            "created_at",
            "project",
        )

    def resolve_comments(self, info):
        return self.comments.order_by("-created_at")


class Query(graphene.ObjectType):
    organizations = graphene.List(OrganizationType)
    projects = graphene.List(ProjectType)
    tasks = graphene.List(TaskType, project_id=graphene.ID(required=True))

    def resolve_organizations(self, info):
        # In a real app, restrict by user; here list all for simplicity.
        return Organization.objects.all().order_by("name")

    def resolve_projects(self, info):
        org = getattr(info.context, "organization", None)
        if not org:
            return Project.objects.none()
        return Project.objects.filter(organization=org).order_by("-created_at")

    def resolve_tasks(self, info, project_id):
        org = getattr(info.context, "organization", None)
        if not org:
            return Task.objects.none()
        try:
            project = Project.objects.get(id=project_id, organization=org)
        except Project.DoesNotExist:
            return Task.objects.none()
        return Task.objects.filter(project=project).order_by("-created_at")


# -----------------
# Mutations
# -----------------

class CreateOrganization(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        contact_email = graphene.String(required=True)
        slug = graphene.String(required=False)

    ok = graphene.Boolean()
    organization = graphene.Field(OrganizationType)

    def mutate(self, info, name, contact_email, slug=None):
        s = slugify(slug or name)
        if Organization.objects.filter(slug=s).exists():
            raise Exception("Organization with this slug already exists")
        org = Organization.objects.create(name=name, slug=s, contact_email=contact_email)
        return CreateOrganization(ok=True, organization=org)


class CreateProject(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        status = graphene.String(required=True)
        description = graphene.String(required=False)
        due_date = graphene.Date(required=False)

    ok = graphene.Boolean()
    project = graphene.Field(ProjectType)

    def mutate(self, info, name, status, description="", due_date=None):
        org = getattr(info.context, "organization", None)
        if not org:
            raise Exception("Organization header missing")
        project = Project.objects.create(
            organization=org,
            name=name,
            status=status,
            description=description,
            due_date=due_date,
        )
        return CreateProject(ok=True, project=project)


class UpdateProject(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        status = graphene.String()
        description = graphene.String()
        due_date = graphene.Date()

    ok = graphene.Boolean()
    project = graphene.Field(ProjectType)

    def mutate(self, info, id, **patch):
        org = getattr(info.context, "organization", None)
        if not org:
            raise Exception("Organization header missing")
        try:
            project = Project.objects.get(id=id, organization=org)
        except Project.DoesNotExist:
            raise Exception("Project not found")
        for k, v in patch.items():
            if v is not None:
                setattr(project, k, v)
        project.save()
        return UpdateProject(ok=True, project=project)


class CreateTask(graphene.Mutation):
    class Arguments:
        project_id = graphene.ID(required=True)
        title = graphene.String(required=True)
        status = graphene.String(required=True)
        description = graphene.String(required=False)
        assignee_email = graphene.String(required=False)
        due_date = graphene.DateTime(required=False)

    ok = graphene.Boolean()
    task = graphene.Field(TaskType)

    def mutate(self, info, project_id, title, status, description="", assignee_email="", due_date=None):
        org = getattr(info.context, "organization", None)
        if not org:
            raise Exception("Organization header missing")
        try:
            project = Project.objects.get(id=project_id, organization=org)
        except Project.DoesNotExist:
            raise Exception("Project not found for this organization")
        task = Task.objects.create(
            project=project,
            title=title,
            status=status,
            description=description,
            assignee_email=assignee_email,
            due_date=due_date,
        )
        return CreateTask(ok=True, task=task)


class UpdateTask(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        title = graphene.String()
        status = graphene.String()
        description = graphene.String()
        assignee_email = graphene.String()
        due_date = graphene.DateTime()

    ok = graphene.Boolean()
    task = graphene.Field(TaskType)

    def mutate(self, info, id, **patch):
        org = getattr(info.context, "organization", None)
        if not org:
            raise Exception("Organization header missing")
        try:
            task = Task.objects.select_related("project").get(id=id, project__organization=org)
        except Task.DoesNotExist:
            raise Exception("Task not found")
        for k, v in patch.items():
            if v is not None:
                setattr(task, k, v)
        task.save()
        return UpdateTask(ok=True, task=task)


class AddComment(graphene.Mutation):
    class Arguments:
        task_id = graphene.ID(required=True)
        content = graphene.String(required=True)
        author_email = graphene.String(required=True)

    ok = graphene.Boolean()
    comment = graphene.Field(TaskCommentType)

    def mutate(self, info, task_id, content, author_email):
        org = getattr(info.context, "organization", None)
        if not org:
            raise Exception("Organization header missing")
        try:
            task = Task.objects.select_related("project").get(id=task_id, project__organization=org)
        except Task.DoesNotExist:
            raise Exception("Task not found")
        comment = TaskComment.objects.create(task=task, content=content, author_email=author_email)
        return AddComment(ok=True, comment=comment)


class Mutation(graphene.ObjectType):
    create_organization = CreateOrganization.Field()
    create_project = CreateProject.Field()
    update_project = UpdateProject.Field()
    create_task = CreateTask.Field()
    update_task = UpdateTask.Field()
    add_comment = AddComment.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
