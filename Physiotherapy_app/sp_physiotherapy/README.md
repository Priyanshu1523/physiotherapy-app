# Physiotherapy Management

**Comprehensive physiotherapy clinic management with appointments, prescriptions, and billing.**

Version: `19.0.1.0.0` · Category: `Healthcare` · License: `OPL-1`

---

## Overview

Physiotherapy Management is a complete clinic management system for Odoo 19. It
helps physiotherapy clinics handle the full patient journey — from registration
and appointment booking through treatment, prescriptions, invoicing, and
follow-up reminders.

## Features

- **Patient registration & medical records** — maintain patient profiles and history.
- **Appointment scheduling** — shift-based availability and calendar booking.
- **Prescriptions & treatment tracking** — record treatments, medicines, and frequency.
- **Invoicing & payments** — integrated billing with the Accounting module.
- **Patient portal & website booking** — let patients book appointments online.
- **SMS reminders** — appointment reminders via Twilio.
- **Video consultations** — Zoom-based remote sessions.
- **Reports** — prescription, appointment slip, and patient card (with QR code) PDFs.

## Requirements

- **Odoo:** 19.0
- **Odoo modules:** `base`, `account`, `contacts`, `hr`, `mail`, `payment`,
  `phone_validation`, `portal`, `product`, `sms`, `stock`, `web`, `website`
- **Python packages:** `twilio`, `qrcode`, `requests`

```bash
pip install twilio qrcode requests
```

## Installation

1. Copy the `sp_physiotherapy` folder into your Odoo addons path.
2. Install the Python dependencies listed above.
3. Restart the Odoo server.
4. Enable **Developer Mode**, update the Apps list, then search for
   **Physiotherapy Management** and click **Install**.

## Support

- **Author / Maintainer:** Supriya Technology
- **Website:** 
- **Support:** chauhanpriyanshu011@gmail.com
