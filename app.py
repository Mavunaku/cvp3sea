from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
import os

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)  # allow requests from any origin

# Email settings
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
RECIPIENTS = os.getenv("RECIPIENTS").split(",")

@app.route("/send-message", methods=["POST"])
def send_message():
    name = request.form.get("name")
    email = request.form.get("email")
    message = request.form.get("message")

    body = f"""
New Contact Form Submission
--------------------------

Name: {name}
Email: {email}

Message:
{message}
"""

    msg = MIMEText(body)
    msg["Subject"] = "New Contact Form Message"
    msg["From"] = SMTP_USER
    msg["To"] = ", ".join(RECIPIENTS)

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, RECIPIENTS, msg.as_string())
        server.quit()
    except Exception as e:
        print("Email Failed:", e)
        return jsonify({"status": "error", "message": "Email failed"}), 500

    return jsonify({"status": "success"})
