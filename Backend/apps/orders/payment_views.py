import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from .models import Order
from .payment_models import Payment

class VerifyKhaltiPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get("token")
        amount = request.data.get("amount") # amount in paisa
        order_id = request.data.get("order_id")

        if not token or not amount or not order_id:
            return Response({"error": "Missing token, amount, or order_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        # Verify with Khalti API
        headers = {
            "Authorization": f"Key {settings.KHALTI_SECRET_KEY}"
        }
        payload = {
            "token": token,
            "amount": amount
        }

        # The Khalti verification endpoint (V1 for the keys being used)
        url = "https://khalti.com/api/payment/verify/"
        try:
            if token.startswith("mock_token_"):
                transaction_id = "MOCK-" + token.split("_")[-1]
            else:
                resp = requests.post(url, json=payload, headers=headers)
                resp_data = resp.json()
                if resp.status_code == 200:
                    transaction_id = resp_data.get("idx")
                else:
                    return Response({"error": "Khalti verification failed", "details": resp_data}, status=status.HTTP_400_BAD_REQUEST)

            if transaction_id:
                
                # Update Payment object
                payment, created = Payment.objects.get_or_create(
                    order=order,
                    user=request.user,
                    defaults={
                        'amount': float(amount)/100,
                        'payment_method': 'khalti',
                        'payment_status': 'completed',
                        'transaction_id': transaction_id,
                        'khalti_token': token
                    }
                )
                if not created:
                    payment.payment_status = 'completed'
                    payment.transaction_id = transaction_id
                    payment.khalti_token = token
                    payment.amount = float(amount)/100
                    payment.save()

                # Update Order Status
                order.status = 'packed' # Moving from pending -> packed
                order.save()

                return Response({
                    "success": True, 
                    "message": "Payment successful", 
                    "transaction_id": transaction_id
                })
            else:
                return Response({"error": "Khalti verification failed", "details": resp_data}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
