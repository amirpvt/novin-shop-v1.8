from rest_framework import generics, permissions
from .models import Testimonial
from .serializers import TestimonialSerializer


class TestimonialListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = TestimonialSerializer

    def get_queryset(self):
        return Testimonial.objects.filter(approved=True)
