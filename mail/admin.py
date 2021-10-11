from django.contrib import admin

from .models import Email


class EmailAdmin(admin.ModelAdmin):
    list_display = ("id", "sender", "user", "read", "archived")
    filter_horizontal = ("recipients",)


admin.site.register(Email, EmailAdmin)
