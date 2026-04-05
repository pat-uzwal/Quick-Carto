"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
import os
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Delivery man endpoints (Priority & Web Harmony)
    path('api/', include('apps.orders.delivery_urls')),

    # Auth + User profile
    path('api/', include('apps.users.urls')),

    # Public product catalog & offers
    path('api/', include('apps.products.urls')),
    path('api/', include('apps.offers.urls')),

    # Customer cart & orders
    path('api/', include('apps.orders.urls')),
    path('api/payments/', include('apps.orders.payment_urls')),

    # Warehouse manager endpoints
    path('api/', include('apps.warehouses.urls')),

    # Admin management endpoints
    path('api/', include('apps.users.admin_urls')),

    # Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    # Serve images from the frontend project folder for development convenience
    from django.urls import re_path
    from django.views.static import serve
    
    frontend_images_path = os.path.join(settings.BASE_DIR.parent, 'Frontend', 'public', 'images')
    urlpatterns += [
        re_path(r'^images/(?P<path>.*)$', serve, {'document_root': frontend_images_path}),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

