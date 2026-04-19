import React from 'react'
import { Checkbox } from '../src/checkbox'
import { Label } from '../src/label'
import '../src/tokens.css'

/**
 * Checkbox Showcase - Implementing Figma Design
 * 
 * Figma Reference: node-id=17085-196155
 * Token Source: Applique.tokens.json
 * 
 * All checkboxes strictly follow Figma Applique design tokens:
 * - Size: 16px × 16px (h-4 w-4)
 * - Border Radius: 2px (rounded-xxs from Applique)
 * - Border: 1px solid
 * - Unchecked: white bg, gray-200 border (--input)
 * - Checked: primary bg & border (#5232D0), white checkmark
 * - Text: text-sm (14px), font-medium (500)
 * - Gap: 8px (gap-2)
 */
export default function CheckboxShowcase() {
  const [checked1, setChecked1] = React.useState(true)
  const [checked2, setChecked2] = React.useState(true)
  const [checked3, setChecked3] = React.useState(true)
  const [checked4, setChecked4] = React.useState(true)
  const [checked5, setChecked5] = React.useState(true)
  const [checked6, setChecked6] = React.useState(true)
  const [checked7, setChecked7] = React.useState(true)
  const [checked8, setChecked8] = React.useState(false)
  const [cardChecked1, setCardChecked1] = React.useState(true)
  const [cardChecked2, setCardChecked2] = React.useState(false)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Checkbox Components
          </h1>
          <p className="text-muted-foreground">
            Implementing Figma design with Applique tokens
          </p>
        </div>

        {/* 1. Basic Checkbox - Checked */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            1. Basic Checkbox (Checked)
          </h2>
          <div className="flex items-start gap-2">
            <Checkbox 
              id="terms1" 
              checked={checked1}
              onCheckedChange={setChecked1}
            />
            <Label 
              htmlFor="terms1" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Accept terms and conditions
            </Label>
          </div>
        </div>

        {/* 2. Destructive Checkbox */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            2. Destructive Checkbox
          </h2>
          <div className="flex items-start gap-2">
            <Checkbox 
              id="terms2" 
              variant="destructive"
              checked={checked2}
              onCheckedChange={setChecked2}
            />
            <Label 
              htmlFor="terms2" 
              className="text-sm font-medium leading-none text-destructive"
            >
              Accept terms and conditions
            </Label>
          </div>
        </div>

        {/* 3. Checkbox with Description */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            3. Checkbox with Description
          </h2>
          <div className="flex items-start gap-2">
            <Checkbox 
              id="terms3" 
              checked={checked3}
              onCheckedChange={setChecked3}
            />
            <div className="flex flex-col gap-1.5">
              <Label 
                htmlFor="terms3" 
                className="text-sm font-medium leading-none"
              >
                Accept terms and conditions
              </Label>
              <p className="text-sm text-muted-foreground leading-tight">
                By clicking this checkbox, you agree to the terms and conditions.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Disabled Checkbox */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            4. Disabled Checkbox
          </h2>
          <div className="flex items-start gap-2">
            <Checkbox 
              id="notifications" 
              checked={checked4}
              onCheckedChange={setChecked4}
              disabled
            />
            <Label 
              htmlFor="notifications" 
              className="text-sm font-medium leading-none"
            >
              Enable notifications
            </Label>
          </div>
        </div>

        {/* 5. Checkbox Group */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            5. Checkbox Group (Simple)
          </h2>
          <div className="flex flex-col gap-3 w-[219px]">
            <div className="flex items-start gap-2">
              <Checkbox 
                id="tech" 
                checked={checked5}
                onCheckedChange={setChecked5}
              />
              <Label htmlFor="tech" className="text-sm font-normal leading-none">
                Technology News
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox 
                id="products" 
                checked={checked6}
                onCheckedChange={setChecked6}
              />
              <Label htmlFor="products" className="text-sm font-normal leading-none">
                Product Updates
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox 
                id="tips" 
                checked={checked7}
                onCheckedChange={setChecked7}
              />
              <Label htmlFor="tips" className="text-sm font-normal leading-none">
                Tips & Tricks
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox 
                id="events" 
                checked={checked8}
                onCheckedChange={setChecked8}
              />
              <Label htmlFor="events" className="text-sm font-normal leading-none">
                Events & Webinars
              </Label>
            </div>
          </div>
        </div>

        {/* 6. Checkbox Group with Card Style */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            6. Checkbox Group (Card Style)
          </h2>
          <div className="flex flex-col gap-3">
            {/* Checked Card */}
            <button 
              className="bg-accent border border-[#b9b9b9] rounded-md p-2.5 flex items-start gap-2 text-left w-full"
              onClick={() => setCardChecked1(!cardChecked1)}
            >
              <Checkbox 
                id="tech-card" 
                checked={cardChecked1}
                onCheckedChange={setCardChecked1}
              />
              <div className="flex flex-col gap-1.5 text-sm">
                <Label htmlFor="tech-card" className="font-normal leading-none">
                  Technology News
                </Label>
                <p className="text-muted-foreground leading-tight">
                  This is a checkbox description.
                </p>
              </div>
            </button>

            {/* Unchecked Card */}
            <button 
              className="border border-border rounded-md p-2.5 flex items-start gap-2 text-left w-full"
              onClick={() => setCardChecked2(!cardChecked2)}
            >
              <Checkbox 
                id="products-card" 
                checked={cardChecked2}
                onCheckedChange={setCardChecked2}
              />
              <div className="flex flex-col gap-1.5 text-sm">
                <Label htmlFor="products-card" className="font-normal leading-none">
                  Product Updates
                </Label>
                <p className="text-muted-foreground leading-tight">
                  This is a checkbox description.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
