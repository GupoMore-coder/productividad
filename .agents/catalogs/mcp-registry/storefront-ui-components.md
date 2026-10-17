# 🛒 Storefront UI E-Commerce Design System MCP Registry Spec

> **Source:** [vuestorefront/storefront-ui](https://github.com/vuestorefront/storefront-ui)  
> **License:** MIT / Open Source  
> **Domain:** Headless E-Commerce Design System & Accessible Component Library for Vue 3 and React, High-Converting Product Cards, Filter Sidebars, Shopping Carts, Checkout Flow Primitives, WCAG Accessible.

---

## 🎯 Visión Arquitectónica

Storefront UI es una biblioteca de componentes de diseño headless y accesible especializada exclusivamente en comercio electrónico para Vue 3 y React. Proporciona bloques de alta conversión y estética cuidada (fichas de productos, selectores de variantes, carritos desplegables y pasarelas de pago) diseñados para tiendas online de marcas exclusivas como More Paper y More Design:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Frontend Architect            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Component Registry / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Storefront UI Core                       │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Vue 3 / React Primitives      │ Tailwind / CSS Custom │  │
│  │ (ProductCard, Gallery)│◄─────►│ (Accessible Tokens)   │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ E-Commerce Conversion: Variant Matrix, Cart, Checkout │  │
│  │ WCAG 2.1 AA Compliance: Full Keyboard Navigation      │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `storefront_list_components`
Enumera los componentes y bloques de comercio electrónico disponibles:

```json
{
  "name": "storefront_list_components",
  "description": "Lists available e-commerce UI components (ProductCard, Rating, Accordion, Gallery, CartDrawer, CheckoutStep) for React/Vue.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "framework": { "type": "string", "enum": ["react", "vue"], "default": "react" }
    }
  }
}
```

### 2. `storefront_get_template`
Devuelve el código fuente accesible de un flujo completo de e-commerce (p. ej. ficha de producto de lujo o carrito):

```json
{
  "name": "storefront_get_template",
  "description": "Returns accessible component source code and style tokens for a designated e-commerce pattern.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "pattern_name": { "type": "string", "enum": ["product_detail_page", "cart_drawer", "filter_sidebar", "checkout_form"] },
      "framework": { "type": "string", "enum": ["react", "vue"], "default": "react" }
    },
    "required": ["pattern_name"]
  }
}
```

---

## 🏛️ Filosofía de Comercio y Marca

1. **Prestigio y Deseo Comercial (Bernard Arnault):** Las interfaces de More Paper y More Design deben priorizar la belleza fotográfica del producto, microinteracciones sutiles y cero aspecto de plantilla económica.
2. **Retención y Conversión (Philip Kotler):** La experiencia de compra debe eliminar toda fricción cognitiva en la selección de variantes y el proceso de checkout.
