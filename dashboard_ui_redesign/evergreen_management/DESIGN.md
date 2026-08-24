---
name: Evergreen Management
colors:
  surface: '#f9f9f8'
  surface-dim: '#d9dad9'
  surface-bright: '#f9f9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f3'
  surface-container: '#edeeed'
  surface-container-high: '#e7e8e7'
  surface-container-highest: '#e1e3e2'
  on-surface: '#191c1c'
  on-surface-variant: '#414846'
  inverse-surface: '#2e3131'
  inverse-on-surface: '#f0f1f0'
  outline: '#717976'
  outline-variant: '#c1c8c4'
  surface-tint: '#43655c'
  primary: '#01261f'
  on-primary: '#ffffff'
  primary-container: '#1a3c34'
  on-primary-container: '#83a69c'
  inverse-primary: '#aacec3'
  secondary: '#556257'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3d5'
  on-secondary-container: '#59665b'
  tertiary: '#2f1d03'
  on-tertiary: '#ffffff'
  tertiary-container: '#473215'
  on-tertiary-container: '#b89a74'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c5eadf'
  primary-fixed-dim: '#aacec3'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#2b4d44'
  secondary-fixed: '#d8e6d8'
  secondary-fixed-dim: '#bccabd'
  on-secondary-fixed: '#131e16'
  on-secondary-fixed-variant: '#3d4a40'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#e2c199'
  on-tertiary-fixed: '#291801'
  on-tertiary-fixed-variant: '#594324'
  background: '#f9f9f8'
  on-background: '#191c1c'
  surface-variant: '#e1e3e2'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is built on a foundation of **Modern Professionalism** with a **Tactile** edge. It is designed for high-end wedding planners and venue operators who require a tool that matches the sophistication of their events. The brand personality is poised, organized, and premium.

The visual style blends **Corporate Modern** structure with **Soft Minimalist** aesthetics. It utilizes generous whitespace, deep botanical tones, and subtle depth to create an environment that feels both high-tech and organic. The UI avoids the sterility of typical SaaS platforms by incorporating soft curves and rich, nature-inspired contrasts.

**Key Visual Principles:**
- **Serene Efficiency:** The interface should feel calm even when displaying complex data.
- **Organic Precision:** Geometric shapes are softened with radii to feel approachable yet intentional.
- **Editorial Polish:** Layouts prioritize clarity and hierarchy, reminiscent of a luxury lifestyle publication.

## Colors

The palette is anchored by **Forest Green** (#1A3C34), providing a sense of stability and luxury. This is supported by a range of **Sage Neutrals** and **Champagne Accents**.

- **Primary (Forest):** Used for navigation backgrounds, primary actions, and key brand moments.
- **Secondary (Mint/Sage):** Used for subtle backgrounds, success states, and secondary button fills.
- **Accent (Champagne):** Used sparingly for highlighting special statuses, premium features, or small decorative elements.
- **Neutral (Parchment/Bone):** The foundation of the layout. We avoid pure white (#FFFFFF) in favor of slightly warmer off-whites to reduce eye strain and increase the high-end feel.

**Color Application:**
- Backgrounds use the Neutral palette to create a layered, physical feel.
- Interactive elements utilize high-contrast Forest Green with White text for maximum legibility.
- Data visualization should use a monochromatic scale of the primary green, supplemented by the champagne accent for "warning" or "attention" states.

## Typography

This design system utilizes **Hanken Grotesk** as the primary typeface for its sharp, contemporary geometry and exceptional legibility. For technical details and metadata, **Geist** provides a mono-influenced clarity that balances the editorial feel of the headlines.

- **Headlines:** Should be set with tight letter-spacing to appear confident and modern.
- **Body:** Maintains standard spacing for maximum readability across long lists and vendor descriptions.
- **Labels:** Used for table headers, small caps, and status badges.
- **Mobile Scaling:** Headlines scale down by approximately 15% on mobile to maintain visual balance without breaking layouts.

## Layout & Spacing

The design system employs a **Fluid-Fixed Hybrid Grid**. 
- **Sidebar:** Fixed at 280px for desktop.
- **Main Content:** Fluid 12-column grid with 24px gutters.
- **Max Width:** Content containers should cap at 1440px to ensure line lengths remain readable on ultra-wide monitors.

**Spacing Rhythm:**
We use an 8px base grid. All margins and paddings should be multiples of 8. 
- Use `lg` (40px) spacing between major sections (e.g., Header to Dashboard Cards).
- Use `md` (24px) for internal card padding and gutters between related elements.
- Use `sm` (12px) for tight groupings like icon + label pairs.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** supplemented by **Ambient Shadows**.

- **Level 0 (Surface):** The main application background (#F8F9F8).
- **Level 1 (Cards):** White (#FFFFFF) surfaces with a very soft, diffused shadow (0px 4px 20px rgba(26, 60, 52, 0.04)).
- **Level 2 (Popovers/Modals):** Floating elements with a more defined shadow (0px 12px 32px rgba(26, 60, 52, 0.08)) and a 1px subtle border in a light sage tint.

Avoid heavy blacks in shadows. Shadows should always be tinted with the primary Forest Green color to maintain a cohesive, "organic" atmosphere.

## Shapes

The shape language is **Rounded**, reflecting the soft nature of wedding planning while maintaining professional structure.

- **Standard Elements:** Buttons, input fields, and small UI components use a 0.5rem (8px) radius.
- **Large Elements:** Dashboard cards and main containers use a 1rem (16px) radius to emphasize the "card-based" layout.
- **Interactive Feedback:** On hover, cards may subtly lift or deepen their shadow, but the corner radius remains constant to preserve the grid's integrity.

## Components

### Buttons
- **Primary:** Forest Green fill, White text. High-contrast, 0.5rem radius.
- **Secondary:** Transparent with Forest Green border or Sage Green light fill.
- **Ghost:** Text-only with Forest Green color, shifting to Sage background on hover.

### Cards
Cards are the primary container for the dashboard. They must include a 16px corner radius and a Level 1 shadow. Header areas within cards should use a subtle 1px bottom border in a light neutral tint to separate titles from content.

### Inputs
Fields should have a soft parchment-colored fill (#F3F4F3) rather than white, making them distinct from the card background. The focus state uses a 2px Forest Green border.

### Chips & Badges
Used for statuses (e.g., "Confirmed", "Pending"). Badges use the Secondary Sage color for background with Primary Forest Green text. For alerts, use the Champagne Accent color.

### Data Visualization
Charts should utilize the primary green palette. Use solid fills for "Completed" data and patterned/dashed fills for "Projected" or "Pending" data to maintain accessibility without relying solely on color.

### Progress Indicators
Progress bars and rings should use a thick stroke (4px+) with rounded caps, maintaining the soft aesthetic of the overall system.