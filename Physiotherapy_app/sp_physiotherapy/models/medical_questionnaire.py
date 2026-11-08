# -*- coding: utf-8 -*-
#########################################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) Supriya Technology (<>).
#
#    For Module Support : chauhanpriyanshu011@gmail.com
#
##########################################################################################

from odoo import fields, models

class MedicalQuestionnaire(models.Model):
    """Patient questionnaire response."""

    _name = "medical.questionnaire"
    _description = "Patient Questionnaire Response"

    question_id = fields.Many2one(
        comodel_name="medical.question",
        string="Question",
        ondelete="cascade",
    )
    response = fields.Selection(
        selection=[
            ("yes", "Yes"),
            ("no", "No"),
        ],
        string="Response",
    )
    notes = fields.Text(string="Notes")
    patient_id = fields.Many2one(
        comodel_name="res.partner",
        string="Patient",
        ondelete="cascade",
    )
