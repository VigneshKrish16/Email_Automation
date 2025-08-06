import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import win32com.client
import pythoncom
import re

class EmailSender:
    def __init__(self, email_address, app_password=None, provider='gmail'):
        self.email = email_address
        self.password = app_password
        self.provider = provider.lower()
        
        # Test connection during initialization for Gmail
        if self.provider == 'gmail' and app_password:
            self._test_gmail_connection()

    def _test_gmail_connection(self):
        """Test Gmail connection during initialization"""
        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(self.email, self.password)
            server.quit()
        except Exception as e:
            raise Exception(f"Failed to initialize Gmail connection: {str(e)}")

    def send_email(self, to, subject, body):
        """
        Send an email with proper validation
        Returns: tuple (success: bool, message: str)
        """
        # Validate required fields
        if not all([to, subject, body]):
            missing = []
            if not to: missing.append('to')
            if not subject: missing.append('subject')
            if not body: missing.append('body')
            return False, f"Missing required fields: {', '.join(missing)}"

        # Extract email if 'to' is a dictionary
        recipient = self._extract_email_from_sender(to) if isinstance(to, dict) else to
        
        if not recipient:
            return False, "Invalid recipient email address"

        try:
            if self.provider == 'gmail':
                msg = MIMEMultipart()
                msg['From'] = self.email
                msg['To'] = recipient
                msg['Subject'] = subject
                msg.attach(MIMEText(body, 'plain'))

                server = smtplib.SMTP('smtp.gmail.com', 587)
                server.starttls()
                server.login(self.email, self.password)
                server.send_message(msg)
                server.quit()
                return True, "Email sent successfully"
                
            elif self.provider == 'outlook':
                pythoncom.CoInitialize()
                outlook = win32com.client.Dispatch("Outlook.Application")
                mail = outlook.CreateItem(0)
                mail.To = recipient
                mail.Subject = subject
                mail.Body = body
                mail.Send()
                pythoncom.CoUninitialize()
                return True, "Email sent successfully"
                
            else:
                return False, f"Unsupported email provider: {self.provider}"
                
        except Exception as e:
            if self.provider == 'outlook':
                pythoncom.CoUninitialize()
            return False, f"Error sending email: {str(e)}"

    def _validate_email(self, email):
        """Validate email address format"""
        if self.provider == 'outlook':
            return True
            
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            raise ValueError(f"Invalid email address format: {email}")
        return True

    def _extract_email_from_sender(self, sender_info):
        """Extract email address from sender info"""
        if isinstance(sender_info, dict):
            if 'sender_email' in sender_info:
                return sender_info['sender_email']
            elif 'email' in sender_info:
                return sender_info['email']
        elif isinstance(sender_info, str):
            if '@' in sender_info:
                return sender_info
        return None

    def reply_to_email(self, original_email, reply_body):
        """Reply to an email"""
        if not all([original_email, reply_body]):
            return False, "Missing required fields for reply"

        if self.provider == 'outlook' and isinstance(original_email, dict) and 'id' in original_email:
            return self._reply_to_outlook_email(original_email['id'], reply_body)
        else:
            subject = f"Re: {original_email.get('subject', '')}"
            to = self._extract_email_from_sender(original_email)
            if not to:
                return False, "Could not determine recipient for reply"
            return self.send_email(to, subject, reply_body)

    def _reply_to_outlook_email(self, email_id, reply_body):
        """Reply to an Outlook email"""
        try:
            pythoncom.CoInitialize()
            outlook = win32com.client.Dispatch("Outlook.Application")
            namespace = outlook.GetNamespace("MAPI")
            
            original_mail = namespace.GetItemFromID(email_id)
            if not original_mail:
                pythoncom.CoUninitialize()
                return False, "Could not find the original email"
                
            reply = original_mail.Reply()
            reply.Body = reply_body
            reply.Send()
            
            pythoncom.CoUninitialize()
            return True, "Reply sent successfully"
        except Exception as e:
            pythoncom.CoUninitialize()
            return False, f"Error replying to Outlook email: {str(e)}"