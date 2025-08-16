from django.contrib import admin
from .models import Organization, Project, Task, TaskComment
admin.site.register([Organization, Project, Task, TaskComment])
