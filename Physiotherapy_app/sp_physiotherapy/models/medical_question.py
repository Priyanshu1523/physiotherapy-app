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

class MedicalQuestion(models.Model):
    """Medical intake question."""

    _name = "medical.question"
    _description = "Medical Question"
    _rec_name = "question_text"

    question_text = fields.Char(
        string="Question",
        required=True,
    )

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        Questionnaire = self.env["medical.questionnaire"]
        for rec in records:
            Questionnaire.create({
                "question_id": rec.id,
            })
        return records

    def unlink(self):
        self.env["medical.questionnaire"].search(
            [("question_id", "in", self.ids)]
        ).unlink()
        return super().unlink()
