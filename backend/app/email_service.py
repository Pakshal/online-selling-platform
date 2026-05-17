import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from app.config import settings
from app import models
import logging

logger = logging.getLogger(__name__)

ORDER_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563EB;">New Order #{{ order.order_number }}</h2>
  <hr>
  <h3>Customer Information</h3>
  <p><b>Name:</b> {{ order.customer_name }}</p>
  <p><b>Phone:</b> {{ order.customer_phone }}</p>
  <p><b>Email:</b> {{ order.customer_email }}</p>
  <p><b>Address:</b> {{ order.delivery_address }}, {{ order.city }} - {{ order.pincode }}</p>
  {% if order.notes %}<p><b>Notes:</b> {{ order.notes }}</p>{% endif %}
  <hr>
  <h3>Order Items</h3>
  <table width="100%" border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
    <tr style="background:#f3f4f6;">
      <th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th>
    </tr>
    {% for item in order.items %}
    <tr>
      <td>{{ item.product_name }}</td>
      <td>{{ item.quantity }}</td>
      <td>₹{{ item.product_price }}</td>
      <td>₹{{ item.subtotal }}</td>
    </tr>
    {% endfor %}
  </table>
  <hr>
  <p><b>Subtotal:</b> ₹{{ order.subtotal }}</p>
  <p><b>Delivery:</b> ₹{{ order.delivery_charges }}</p>
  <p style="font-size:1.2em;"><b>Total: ₹{{ order.total_amount }}</b></p>
  <hr>
  <p>Please log in to your admin panel to confirm this order.</p>
</body>
</html>
"""


def send_order_notification(order_id, admin_email: str) -> None:
    from app.database import SessionLocal
    from sqlalchemy.orm import joinedload
    from uuid import UUID
    db = SessionLocal()
    try:
        order = (
            db.query(models.Order)
            .options(joinedload(models.Order.items))
            .filter(models.Order.id == order_id)
            .first()
        )
        if not order:
            logger.error("Order %s not found for email notification", order_id)
            return
    except Exception as exc:
        logger.error("Failed to load order for email: %s", exc)
        db.close()
        return
    try:
        template = Template(ORDER_EMAIL_TEMPLATE)
        html_content = template.render(order=order)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"New Order #{order.order_number}"
        msg["From"] = settings.FROM_EMAIL
        msg["To"] = admin_email
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.FROM_EMAIL, admin_email, msg.as_string())

        logger.info("Order notification sent to %s", admin_email)
    except Exception as e:
        logger.error("Failed to send order email: %s", e)
    finally:
        db.close()
