import imaplib
import email
from email.header import decode_header
import re
import pythoncom
import win32com.client
from datetime import datetime

class EmailFetcher:
    def __init__(self, email_address, app_password, provider='gmail'):
        self.email = email_address
        self.password = app_password
        self.provider = provider
        if self.provider == 'outlook':
            try:
                pythoncom.CoInitialize()
            except:
                pass

    def test_connection(self):
        """Test email connection based on provider"""
        if self.provider == 'gmail':
            try:
                mail = imaplib.IMAP4_SSL("imap.gmail.com")
                mail.login(self.email, self.password)
                mail.logout()
                return True
            except Exception as e:
                print(f"Gmail connection test failed: {str(e)}")
                return False
        elif self.provider == 'outlook':
            try:
                outlook = win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")
                return True
            except Exception as e:
                print(f"Outlook connection test failed: {str(e)}")
                return False
        else:
            print(f"Unsupported provider: {self.provider}")
            return False

    def fetch_emails(self):
        """Fetch emails based on provider"""
        if self.provider == 'gmail':
            return self._fetch_gmail_emails()
        elif self.provider == 'outlook':
            return self._fetch_outlook_emails()
        else:
            print(f"Unsupported provider: {self.provider}")
            return []

    def _fetch_gmail_emails(self):
        """Fetch all received emails from Gmail using IMAP"""
        try:
            mail = imaplib.IMAP4_SSL("imap.gmail.com")
            mail.login(self.email, self.password)
            mail.select("inbox")

            status, messages = mail.search(None, "ALL")
            email_ids = messages[0].split()

            emails_list = []
            count = 0 
            for num in email_ids:
                if count >= 50:
                    break
                
                status, msg_data = mail.fetch(num, "(RFC822)")

                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])

                        # Extract sender information
                        sender_raw = msg.get("From", "")
                        if self.email.lower() in sender_raw.lower():
                            continue
                        
                        # Get sender name and email
                        sender_name, sender_email = self._parse_email_address(sender_raw)

                        # If no sender name, use email username
                        if not sender_name and sender_email:
                            sender_name = sender_email.split('@')[0]

                        # Get subject
                        subject = msg.get("Subject", "No Subject")
                        if subject:
                            subject, encoding = decode_header(subject)[0]
                            if isinstance(subject, bytes):
                                subject = subject.decode(encoding if encoding else "utf-8")

                        # Get body
                        body = self._extract_email_body(msg)

                        # Get date
                        date = msg.get("Date", "No Date")
                        # Standardize date format
                        try:
                            date = datetime.strptime(date, "%a, %d %b %Y %H:%M:%S %z").strftime("%Y-%m-%d %H:%M:%S")
                        except ValueError:
                            date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                        emails_list.append({
                            'id': num.decode(),
                            'sender_name': sender_name or "No Name",
                            'sender_email': sender_email or "No Email",
                            'subject': subject,
                            'body': body,
                            'date': date
                        })

                        count += 1  # Increment the counter after processing each email

            mail.logout()
            return emails_list
        except Exception as e:
            print(f"Error fetching Gmail emails: {str(e)}")
            return []

    def _fetch_outlook_emails(self):
        """Fetch all received emails from Outlook"""
        try:
            try:
                pythoncom.CoInitialize()
            except:
                pass
                
            outlook = win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")
            inbox = outlook.GetDefaultFolder(6)
            
            if inbox is None:
                print("Error: Could not access Outlook inbox")
                return []
                
            messages = inbox.Items
            if messages is None:
                print("Error: Could not access inbox items")
                return []
                
            emails_list = []
            messages.Sort("[ReceivedTime]", True)

            for mail in messages:
                if mail is None:
                    continue

                try:
                    # Get sender information
                    sender_name, sender_email = self._extract_outlook_sender(mail)
                    
                    # Skip if the sender is the user
                    if sender_email and self.email.lower() in sender_email.lower():
                        continue

                    subject = mail.Subject if hasattr(mail, 'Subject') else "No Subject"
                    body = mail.Body if hasattr(mail, 'Body') else ""
                    
                    date = (mail.ReceivedTime.strftime("%Y-%m-%d %H:%M:%S") 
                           if hasattr(mail, 'ReceivedTime') else "No Date")

                    emails_list.append({
                        "sender_name": sender_name,
                        "sender_email": sender_email,
                        "subject": subject,
                        "body": body,
                        "date": date
                    })
                    
                except Exception as e:
                    print(f"Error processing Outlook email: {e}")
            
            return emails_list
        except Exception as e:
            print(f"Error fetching Outlook emails: {str(e)}")
            return []

    def _extract_email_body(self, msg):
        """Extract email body from message"""
        try:
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        try:
                            return part.get_payload(decode=True).decode()
                        except:
                            return "Unable to decode email body"
            else:
                try:
                    return msg.get_payload(decode=True).decode()
                except:
                    return "Unable to decode email body"
            return ""
        except Exception as e:
            print(f"Error extracting email body: {str(e)}")
            return "Error extracting email body"

    def _extract_outlook_sender(self, mail_item):
        """Extract both sender name and email from an Outlook mail item"""
        try:
            if not mail_item:
                return "No Sender", "No Email"

            # Get sender name
            sender_name = None
            
            # Try SenderName first
            if hasattr(mail_item, 'SenderName') and mail_item.SenderName:
                # Remove email address if present in sender name
                sender_name = re.sub(r'\s*<.*?>\s*', '', mail_item.SenderName).strip()
            
            # Try Sender object if no name yet
            if not sender_name and hasattr(mail_item, 'Sender'):
                if hasattr(mail_item.Sender, 'Name'):
                    sender_name = mail_item.Sender.Name

            # Get email address
            email_address = None
            
            # Try SenderEmailAddress
            if hasattr(mail_item, 'SenderEmailAddress') and mail_item.SenderEmailAddress:
                email_address = mail_item.SenderEmailAddress.strip()
            
            # Try Sender object if no email yet
            if not email_address and hasattr(mail_item, 'Sender'):
                if hasattr(mail_item.Sender, 'Address'):
                    email_address = mail_item.Sender.Address.strip()

            # Try extracting from SenderName if still no email
            if not email_address and hasattr(mail_item, 'SenderName'):
                match = re.search(r'<([^>]+@[^>]+)>', mail_item.SenderName)
                if match:
                    email_address = match.group(1).strip()

            # Use email username as sender name if no name found
            if not sender_name and email_address:
                sender_name = email_address.split('@')[0]

            return sender_name or "No Name", email_address or "No Email"

        except Exception as e:
            print(f"Error extracting Outlook sender info: {str(e)}")
            return "Error", "No Email"

    def _parse_email_address(self, sender):
        """Extract name and email from a raw email address string"""
        try:
            if not sender:
                return "No Name", "No Email"
                
            # Try to match "Name <email@domain.com>" format
            match = re.search(r'"?([^"<]+)"?\s*<?([^>]+@[^>]+)>?', sender)
            if match:
                name = match.group(1).strip()
                email = match.group(2).strip()
                return name, email
                
            # Try to match just email address
            email_match = re.search(r'([^<\s]+@[^>\s]+)', sender)
            if email_match:
                email = email_match.group(1)
                # Use email username as name if no name found
                name = email.split('@')[0]
                return name, email
                
            return "No Name", sender or "No Email"
            
        except Exception as e:
            print(f"Error parsing email address: {str(e)}")
            return "Error", "No Email"