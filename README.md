# Fullshine Car Detailing

Sistema de gestión y reservas online para un negocio de car detailing. Incluye sitio web público con booking online y panel de administración completo.

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.7 |
| UI | React | 19.2.4 |
| Estilos | Tailwind CSS | v4 |
| Base de Datos | Supabase (PostgreSQL) | ^2.108.0 |
| Autenticación | Supabase Auth + SSR | ^0.12.0 |
| Emails | Resend | ^6.12.4 |
| Icons | lucide-react | ^1.17.0 |
| Fechas | date-fns | ^4.4.0 |
| Deploy | Vercel | - |
| Lenguaje | TypeScript | ^5 |

## Estructura del Proyecto

```
fullshine-detailing/
├── public/
│   └── img/
│       └── hero.png              # Imagen del hero section
├── supabase/
│   ├── schema.sql                # Schema completo de la BD
│   ├── migration.sql             # Migración para tablas nuevas
│   ├── security-migration.sql    # Políticas RLS seguras
│   └── create-admin.sql          # Script para crear usuario admin
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (metadata, fonts, SEO)
│   │   ├── page.tsx              # Landing page pública
│   │   ├── globals.css           # Estilos globales + tema
│   │   ├── actions.ts            # Server Actions (emails)
│   │   ├── sitemap.ts            # Sitemap SEO
│   │   ├── robots.ts             # Robots.txt
│   │   ├── booking/
│   │   │   └── page.tsx          # Flujo de reservas (3 pasos)
│   │   └── admin/
│   │       ├── layout.tsx        # Layout admin con sidebar
│   │       ├── page.tsx          # Dashboard principal
│   │       ├── login/
│   │       │   └── page.tsx      # Login de administración
│   │       ├── services/
│   │       │   └── page.tsx      # CRUD de servicios
│   │       ├── vehicles/
│   │       │   └── page.tsx      # CRUD de vehículos
│   │       ├── work-orders/
│   │       │   └── page.tsx      # Órdenes de trabajo
│   │       ├── products/
│   │       │   └── page.tsx      # Inventario de productos
│   │       ├── availability/
│   │       │   └── page.tsx      # Gestión horarios + bloqueos
│   │       ├── clients/
│   │       │   └── page.tsx      # Base de clientes
│   │       └── settings/
│   │           └── page.tsx      # Configuración
│   ├── components/
│   │   └── AnimateOnScroll.tsx   # Componente de animación al scroll
│   ├── hooks/
│   │   └── useInView.ts          # Hook para detectar elementos en viewport
│   ├── lib/
│   │   ├── supabase.ts           # Cliente Supabase (browser + server)
│   │   ├── emails.ts             # Servicio de emails via Resend
│   │   └── utils.ts              # Utilidades (cn, formatCurrency, formatDuration)
│   └── middleware.ts             # Middleware de autenticación
├── .env.example
├── vercel.json
└── package.json
```

## Base de Datos

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `services` | Catálogo de servicios de detailing |
| `clients` | Clientes registrados |
| `vehicles` | Vehículos asociados a clientes |
| `appointments` | Turnos/citas reservados |
| `work_orders` | Órdenes de trabajo |
| `work_order_items` | Ítems de cada orden de trabajo |
| `products` | Inventario de productos |
| `schedules` | Disponibilidad semanal |
| `blocks` | Bloqueo de fechas específicas |

### Políticas RLS

- **Servicios**: Público lee activos, solo autenticados (admin) pueden editar/crear/eliminar
- **Clientes**: Público puede leer/insertar/actualizar, admin gestiona todo
- **Turnos**: Público puede insertar (booking), admin gestiona todo
- **Vehículos**: Público puede leer/insertar, admin gestiona todo
- **Órdenes, productos, schedules, blocks**: Solo usuarios autenticados

## Funcionalidades

### Sitio Web Público

#### Landing Page (`/`)
- Hero con imagen y call-to-action
- Sección de servicios por categoría (Exterior, Interior, Completo)
- Features section (Premium, Rápido, Garantía)
- CTA final
- Botón flotante de WhatsApp
- Animaciones al scroll (fade-in, stagger, scale)
- Hover effects en cards y botones

#### Booking Online (`/booking`)
- **Paso 1**: Selección de servicio con modal de información
- **Paso 2**: Calendario de 21 días + selección de horario
- **Paso 3**: Formulario de datos del cliente
- Verificación de servicios duplicados (notifica si ya tiene turno para el mismo servicio en la misma fecha)
- Envío de email de confirmación via Resend
- Redirección automática a WhatsApp con mensaje formateado

### Panel de Administración

#### Login (`/admin/login`)
- Autenticación con Supabase Auth (email + contraseña)
- Middleware que protege todas las rutas `/admin/*`
- Redirect automático si ya está logueado

#### Dashboard (`/admin`)
- Estadísticas: turnos totales, clientes, ingresos estimados
- Lista de próximos turnos con info del cliente y servicio
- Eliminación de turnos con confirmación
- Acciones rápidas: Nueva orden, Gestionar servicios, Bloquear fecha

#### Servicios (`/admin/services`)
- CRUD completo (Crear, Leer, Actualizar, Eliminar)
- Activar/desactivar servicios con toggle
- Modal de edición lateral
- Modal de confirmación de eliminación
- Formato de duración en horas (ej: 1h 30min)

#### Vehículos (`/admin/vehicles`)
- CRUD completo
- Asociación con clientes
- Campos: marca, modelo, año, color, patente, notas

#### Órdenes de Trabajo (`/admin/work-orders`)
- Crear órdenes asociando cliente + vehículo
- Agregar ítems (servicios) con cantidad y precio
- Recálculo automático del total
- Estados: Pendiente → En Progreso → Completada
- Eliminación de ítems y órdenes

#### Productos (`/admin/products`)
- CRUD completo de inventario
- Alerta de stock bajo
- Filtros por búsqueda y categoría
- Campos: nombre, marca, categoría, precio compra/venta, stock, unidad

#### Clientes (`/admin/clients`)
- Lista de clientes con búsqueda
- Link directo a WhatsApp
- Exportar CSV (UI presente)

#### Disponibilidad (`/admin/availability`)
- Gestión de horarios por día de la semana
- Bloqueo de fechas específicas (feriados, vacaciones)

## Seguridad

- **Middleware**: Protege todas las rutas `/admin/*`, redirige a login si no autenticado
- **RLS (Row Level Security)**: Políticas restrictivas en todas las tablas
- **Supabase Auth**: Sesiones manejadas via cookies (no localStorage)
- **Closure del admin**: Bloqueado por robots.txt

## Variables de Entorno

Copiá `.env.example` a `.env.local` y completá:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Resend (emails)
RESEND_API_KEY=tu-api-key-de-resend

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=5492915275183

# App
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

## Setup Inicial

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env.local
# Completar con tus credenciales de Supabase y Resend
```

### 3. Configurar base de datos en Supabase
Ejecutar en orden en el SQL Editor de Supabase:
1. `supabase/schema.sql` (schema completo)
2. `supabase/migration.sql` (tablas nuevas)
3. `supabase/security-migration.sql` (políticas RLS seguras)

### 4. Crear usuario admin
1. Ir a **Supabase > Authentication > Users > Add User**
2. Email: `admin@fullshine.com` (o el que quieras)
3. Contraseña: una contraseña segura
4. Marcar **Auto Confirm User**

### 5. Desarrollo
```bash
npm run dev
```

### 6. Build y deploy
```bash
npm run build
```

## Deploy en Vercel

1. Conectar el repositorio a Vercel
2. Configurar variables de entorno en el dashboard de Vercel
3. Deploy automático en cada push a `main`

## Animaciones

- **Scroll animations**: Elementos aparecen al entrar en viewport (fadeUp, fadeLeft, fadeRight, scaleUp)
- **Stagger**: Cards de servicios aparecen en cascada con delay progresivo
- **Hover effects**: Scale + shadow en cards, botones y features
- **Transiciones**: Suaves en todos los interactivos (300ms)
- **WhatsApp button**: Bounce sutil permanente

## Formato de Duración

Las duraciones se muestran en formato legible:
- `45 min` → **45min**
- `60 min` → **1h**
- `90 min` → **1h 30min**
- `120 min` → **2h**

## Licencia

Privado - Fullshine Car Detailing
