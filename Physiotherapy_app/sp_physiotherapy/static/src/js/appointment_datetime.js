/** @odoo-module **/

/**
 * TC-B17 Fix: Scoped 30-minute datetime widget.
 *
 * The original datetime_30_minute.js patched DateTimeField.prototype
 * globally, forcing 30-minute steps on ALL datetime pickers in ALL
 * Odoo apps (Invoicing, HR, Sales, etc.).
 *
 * This replacement registers a dedicated widget "appointment_datetime"
 * that applies the restriction only where explicitly used.
 *
 * Usage in appointment form view XML:
 *   <field name="appointment_date" widget="appointment_datetime"/>
 */

import { DateTimeField } from "@web/views/fields/datetime/datetime_field";
import { registry } from "@web/core/registry";

export class AppointmentDatetime extends DateTimeField {
    /**
     * Override timePickerProps to enforce 30-minute steps.
     * All other DateTimeField behaviour is inherited unchanged.
     */
    get timePickerProps() {
        return {
            ...super.timePickerProps,
            minuteStep: 30,
            hoursStep: 1,
        };
    }
}

AppointmentDatetime.displayName = "AppointmentDatetime";

registry
    .category("fields")
    .add("appointment_datetime", AppointmentDatetime);
