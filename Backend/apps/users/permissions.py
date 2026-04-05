from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    """Allow access only to users with 'admin' role, or superusers."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'admin' or request.user.is_superuser))

class IsWarehouseManager(BasePermission):
    """Allow access only to users with 'warehouse' role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'warehouse')

class IsDeliveryMan(BasePermission):
    """Allow access only to users with 'delivery' role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'delivery')

class IsCustomer(BasePermission):
    """Allow access only to users with 'user' (customer) role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'user')

class IsAdminOrWarehouse(BasePermission):
    """Allow access to admins or warehouse managers."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('admin', 'warehouse'))

class IsAdminOrDelivery(BasePermission):
    """Allow access to admins or delivery men."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('admin', 'delivery'))
