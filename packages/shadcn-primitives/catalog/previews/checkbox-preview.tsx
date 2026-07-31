import * as React from 'react'
import { Checkbox } from '../../src/checkbox'

interface CheckboxExampleProps {
  checked?: boolean | 'indeterminate'
  description?: string
  disabled?: boolean
  id: string
  invalid?: boolean
  label: string
  variant?: 'default' | 'destructive'
}

function CheckboxExample({
  checked,
  description,
  disabled,
  id,
  invalid,
  label,
  variant,
}: CheckboxExampleProps) {
  return (
    <label className="checkbox-example" htmlFor={id}>
      <Checkbox
        id={id}
        defaultChecked={checked}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        variant={variant}
      />
      <span className="checkbox-example__copy">
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
    </label>
  )
}

function ControlledCheckboxExample() {
  const [checked, setChecked] = React.useState<boolean | 'indeterminate'>(false)

  return (
    <label className="checkbox-example" htmlFor="checkbox-controlled">
      <Checkbox
        id="checkbox-controlled"
        checked={checked}
        onCheckedChange={setChecked}
      />
      <span className="checkbox-example__copy">
        <strong>Controlled checkbox</strong>
        <small>{checked === true ? 'Checked' : 'Unchecked'}</small>
      </span>
    </label>
  )
}

export function CheckboxPreview() {
  return (
    <div className="preview-stack">
      <section className="preview-group">
        <h3>States</h3>
        <div className="preview-column">
          <CheckboxExample id="checkbox-unchecked" label="Unchecked" />
          <CheckboxExample id="checkbox-checked" checked label="Checked" />
          <CheckboxExample
            id="checkbox-indeterminate"
            checked="indeterminate"
            label="Indeterminate"
          />
          <CheckboxExample id="checkbox-disabled" disabled label="Disabled" />
          <CheckboxExample
            id="checkbox-disabled-checked"
            checked
            disabled
            label="Disabled and checked"
          />
        </div>
      </section>

      <section className="preview-group">
        <h3>Controlled</h3>
        <div className="preview-column">
          <ControlledCheckboxExample />
        </div>
      </section>

      <section className="preview-group">
        <h3>Variants</h3>
        <div className="preview-column">
          <CheckboxExample id="checkbox-default" checked label="Default" />
          <CheckboxExample
            id="checkbox-destructive"
            checked
            label="Destructive"
            variant="destructive"
          />
        </div>
      </section>

      <section className="preview-group">
        <h3>Invalid</h3>
        <div className="preview-column">
          <CheckboxExample
            id="checkbox-invalid"
            checked
            invalid
            label="Accept terms"
            description="This field is required."
            variant="destructive"
          />
        </div>
      </section>

      <section className="preview-group">
        <h3>Description</h3>
        <div className="preview-column">
          <CheckboxExample
            id="checkbox-description"
            label="Use different settings for my mobile devices"
            description="You can manage mobile notifications separately."
          />
        </div>
      </section>

      <section className="preview-group">
        <h3>Group</h3>
        <div
          className="checkbox-demo-group"
          role="group"
          aria-label="Notifications"
        >
          <CheckboxExample id="checkbox-group-email" checked label="Email" />
          <CheckboxExample id="checkbox-group-sms" label="SMS" />
          <CheckboxExample
            id="checkbox-group-push"
            checked
            label="Push notifications"
          />
        </div>
      </section>

      <section className="preview-group">
        <h3>Table</h3>
        <div className="checkbox-table-scroll">
          <table className="checkbox-demo-table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Select</span>
                </th>
                <th scope="col">Channel</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Checkbox aria-label="Select email channel" defaultChecked />
                </td>
                <td>Email</td>
                <td>Enabled</td>
              </tr>
              <tr>
                <td>
                  <Checkbox aria-label="Select SMS channel" />
                </td>
                <td>SMS</td>
                <td>Paused</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="preview-group">
        <h3>RTL</h3>
        <div dir="rtl">
          <CheckboxExample
            id="checkbox-rtl"
            checked
            label="تفعيل الإشعارات"
            description="يمكنك تغيير هذا الإعداد لاحقًا."
          />
        </div>
      </section>
    </div>
  )
}
