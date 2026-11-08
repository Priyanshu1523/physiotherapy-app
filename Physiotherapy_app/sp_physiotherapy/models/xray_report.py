# -*- coding: utf-8 -*-
#########################################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) Supriya Technology (<>).
#
#    For Module Support : chauhanpriyanshu011@gmail.com
#
##########################################################################################

from odoo import api, fields, models

class XRayReport(models.Model):
    """X-Ray and scan report for patients."""

    _name = "xray.report"
    _description = "X-Ray Report"
    _order = "report_date desc, id desc"

    patient_id = fields.Many2one(
        comodel_name="res.partner",
        string="Patient",
        required=True,
        ondelete="cascade",
        domain=[("is_patient", "=", True)],
    )
    report_date = fields.Date(
        string="Report Date",
        default=fields.Date.today,
        required=True,
    )
    description = fields.Text(string="Description")
    scan_image = fields.Binary(
        string="Scan Image",
        attachment=True,
    )
    image_filename = fields.Char(
        string="Image Filename")

    @api.depends("patient_id", "report_date")
    def _compute_display_name(self):
        for rec in self:
            patient = rec.patient_id.display_name or ""
            date = fields.Date.to_string(rec.report_date) if rec.report_date else ""
            rec.display_name = "X-Ray - %s (%s)" % (patient, date) if patient else "X-Ray Report"