# -*- coding: utf-8 -*-
#########################################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) Supriya Technology (<>).
#
#    For Module Support : chauhanpriyanshu011@gmail.com
#
##########################################################################################

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class MedicalEquipment(models.Model):
    """Medical equipment tracking with lifecycle."""

    _name = "medical.equipment"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Medical Equipment"
    _order = "create_date desc"

    name = fields.Char(
        string="Equipment Name",
        compute="_compute_name",
        store=True,
    )
    product_id = fields.Many2one(
        comodel_name="product.product",
        string="Equipment Product",
        required=True,
        ondelete="restrict",
    )
    serial_number = fields.Char(
        string="Serial Number",
        required=True,
    )
    company_id = fields.Many2one(
        comodel_name="res.company",
        default=lambda self: self.env.company,
    )
    department = fields.Char(string="Department")
    assigned_to = fields.Char(string="Assigned To")
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("active", "Active"),
            ("maintenance", "Under Maintenance"),
            ("retired", "Retired"),
        ],
        default="draft",
        tracking=True,
    )
    acquisition_date = fields.Date(
        string="Acquisition Date",
    )
    retirement_date = fields.Date(
        string="Retirement Date",
    )
    notes = fields.Text(string="Notes")

    _serial_number_unique = models.Constraint(
        "UNIQUE(serial_number)",
        "Serial number must be unique.",
    )

    @api.depends("product_id", "serial_number")
    def _compute_name(self):
        for rec in self:
            parts = []
            if rec.product_id:
                parts.append(rec.product_id.name or "")
            if rec.serial_number:
                parts.append(rec.serial_number)
            rec.name = " - ".join(parts) if parts else ""


    def action_activate(self):
        """Activate equipment and set acquisition date."""
        for rec in self:
            if rec.state != "draft":
                raise ValidationError(
                    _("Only draft equipment can be "
                      "activated.")
                )
            rec.write({
                "state": "active",
                "acquisition_date": fields.Date.today(),
            })

    def action_maintenance(self):
        """Send active equipment to maintenance."""
        for rec in self:
            if rec.state != "active":
                raise ValidationError(
                    _("Only active equipment can be "
                      "sent to maintenance.")
                )
            rec.state = "maintenance"

    def action_retire(self):
        """Retire equipment and record date."""
        for rec in self:
            if rec.state == "retired":
                continue
            rec.write({
                "state": "retired",
                "retirement_date": fields.Date.today(),
                "assigned_to": False,
            })

    def action_reset_draft(self):
        """Reset equipment back to draft."""
        for rec in self:
            rec.write({
                "state": "draft",
                "acquisition_date": False,
                "retirement_date": False,
            })
