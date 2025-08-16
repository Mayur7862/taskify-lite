from django.http import JsonResponse
from .models import Organization

class OrgContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        slug = request.headers.get("X-Org-Slug")
        request.organization = None
        if slug:
            try:
                request.organization = Organization.objects.get(slug=slug)
            except Organization.DoesNotExist:
                # Be permissive: don't hard-fail with 400.
                # Public queries like `organizations` and createOrganization should still work.
                request.organization = None
        return self.get_response(request)
