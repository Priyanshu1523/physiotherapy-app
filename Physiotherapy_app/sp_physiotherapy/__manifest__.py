# -*- coding: utf-8 -*-
#########################################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) Supriya Technology.
#
#    For Module Support : chauhanpriyanshu011@gmail.com
#
##########################################################################################

{
    "name": "Physiotherapy Management",
    "version": "19.0.2.3.7",
    "summary": (
        "Comprehensive physiotherapy clinic management"
        " with appointments, prescriptions, and billing"
    ),
    "category": "Healthcare",
    "description": """
    Physiotherapy Management System
    ================================
    Manage physiotherapy clinics with:
    - Patient registration and medical records
    - Appointment scheduling with shift-based availability
    - Prescription and treatment tracking
    - Invoicing and payment management
    - Patient portal and website booking
    - SMS reminders via Twilio
    - Video consultations via Zoom """,
    "depends": [
        "base",
        "account",
        "contacts",
        "hr",
        "mail",
        "payment",
        "phone_validation",
        "portal",
        "product",
        "sms",
        "stock",
        "web",
        "website",
    ],
    "data": [
        "security/physiotherapy_groups.xml",
        "security/ir.model.access.csv",
        "security/ir_rule.xml",
        "data/ir_sequence_data.xml",
        "data/medical_specialist_data.xml",
        "data/treatment_category_data.xml",
        "data/medical_treatment_data.xml",
        "data/medical_time_shift_data.xml",
        "data/medicine_frequency_data.xml",
        "data/medical_working_day_data.xml",
        "data/mail_template_data.xml",
        "data/sms_template_data.xml",
        "data/ir_cron_data.xml",
        "demo/physiotherapy_demo.xml",
        # Views
        "views/res_partner_views.xml",
        "views/hr_employee_views.xml",
        "views/medical_appointment_views.xml",
        "views/medical_prescription_views.xml",
        "views/medical_treatment_views.xml",
        "views/treatment_category_views.xml",
        "views/medical_specialist_views.xml",
        "views/medical_time_shift_views.xml",
        "views/medical_medicine_views.xml",
        "views/medicine_frequency_views.xml",
        "views/medical_source_views.xml",
        "views/medical_question_views.xml",
        "views/medical_equipment_views.xml",
        "views/medical_payment_views.xml",
        "views/xray_report_views.xml",
        "views/res_config_settings_views.xml",
        "views/menus.xml",
        "views/portal_templates.xml",
        "views/portal_appointment_templates.xml",
        "views/website_appointment_templates.xml",
        "views/website_menu.xml",
        "report/prescription_report.xml",
        "report/prescription_templates.xml",
        "report/appointment_slip_report.xml",
        "report/patient_card_report.xml",
        "report/patient_card_templates.xml",
    ],
    "author": "Supriya Technology",
    "maintainer": "Supriya Technology",
    "website": "",
    "support": "chauhanpriyanshu011@gmail.com",
    "installable": True,
    "application": True,
    "auto_install": False,
    "license": "OPL-1",
    "price": 35.44,
    "currency": "EUR",
    "external_dependencies": {
        "python": ["qrcode", "requests"],
    },
    "assets": {
        "web.assets_frontend": [
            "sp_physiotherapy/static/src/js/appointment_slots.js",
        ],
        "web.assets_backend": [
            "sp_physiotherapy/static/src/js/calendar_patch.js",
            "sp_physiotherapy/static/src/js/disable_select_role.js",
            "sp_physiotherapy/static/src/js/global_delete_confirm.js",
            "sp_physiotherapy/static/src/css/calendar.css",
        ],
    },
    "images": ["static/description/physiotherapy_banner_offer.png"],
}
