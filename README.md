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
│   ├── full-migration.sql        # Migración completa (máquinas, recurrencias, transacciones, profiles)
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
│   │       ├── layout.tsx        # Layout admin con sidebar + shortcuts
│   │       ├── page.tsx          # Dashboard principal con reportes
│   │       ├── login/
│   │       │   └── page.tsx      # Login de administración
│   │       ├── services/
│   │       │   └── page.tsx      # CRUD de servicios
│   │       ├── vehicles/
│   │       │   └── page.tsx      # CRUD de vehículos
│   │       ├── work-orders/
│   │       │   └── page.tsx      # Órdenes de trabajo + facturas
│   │       ├── products/
│   │       │   └── page.tsx      # Inventario de productos
│   │       ├── availability/
│   │       │   └── page.tsx      # Gestión horarios + bloqueos
│   │       ├── clients/
│   │       │   └── page.tsx      # Base de clientes (CRUD)
│   │       ├── calendar/
│   │       │   └── page.tsx      # Calendario mensual
│   │       ├── recurrences/
│   │       │   └── page.tsx      # Turnos recurrentes
│   │       ├── machines/
│   │       │   └── page.tsx      # Gestión de máquinas
│   │       ├── accounting/
│   │       │   └── page.tsx      # Contabilidad (ingresos/gastos)
│   │       ├── users/
│   │       │   └── page.tsx      # Gestión de usuarios con roles
│   │       └── settings/
│   │           └── page.tsx      # Configuración
│   ├── components/
│   │   ├── AnimateOnScroll.tsx   # Componente de animación al scroll
│   │   └── GlobalSearch.tsx      # Búsqueda global (Ctrl+K)
│   ├── hooks/
│   │   ├── useInView.ts          # Hook para detectar elementos en viewport
│   │   └── useKeyboardShortcuts.ts # Atajos de teclado del admin
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
| `machines` | Máquinas y equipos del taller |
| `recurrences` | Turnos recurrentes (diario/semanal/mensual) |
| `transactions` | Transacciones financieras (ingresos/gastos) |
| `profiles` | Perfiles de usuario con roles (admin/gerente/empleado) |

### Políticas RLS

- **Servicios**: Público lee activos, solo autenticados (admin) pueden editar/crear/eliminar
- **Clientes**: Público puede leer/insertar/actualizar, admin gestiona todo
- **Turnos**: Público puede insertar (booking), admin gestiona todo
- **Vehículos**: Público puede leer/insertar, admin gestiona todo
- **Órdenes, productos, schedules, blocks**: Solo usuarios autenticados
- **Máquinas, recurrencias, transacciones, profiles**: Solo usuarios autenticados

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
- Estadísticas reales: turnos, clientes, ingresos calculados de órdenes completadas
- Top 5 servicios populares (por cantidad de órdenes)
- Top 5 mejores clientes (por gasto total)
- Estado del taller (pendiente/en progreso/completado)
- Alertas de stock bajo
- Lista de próximos turnos con info del cliente y servicio
- Eliminación de turnos con confirmación

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
- **Filtros**: búsqueda por cliente/vehículo, estado, rango de fechas
- **Exportar CSV**: con filtros activos aplicados
- **Generar Factura**: HTML imprimible para órdenes completadas

#### Productos (`/admin/products`)
- CRUD completo de inventario
- Alerta de stock bajo
- Filtros por búsqueda y categoría
- Campos: nombre, marca, categoría, precio compra/venta, stock, unidad

#### Clientes (`/admin/clients`)
- CRUD completo con campos: nombre, apellido, email, teléfono, dirección, notas
- Búsqueda por nombre, email o teléfono
- Link directo a WhatsApp
- Exportar CSV

#### Calendario (`/admin/calendar`)
- Vista mensual con cuadrícula de días
- Preview de turnos en cada día
- Modal con detalle del día y creación de turnos

#### Recurrencias (`/admin/recurrences`)
- CRUD de turnos recurrentes (diario/semanal/mensual)
- Botón "Generar Turnos de Hoy" para crear citas pendientes
- Frecuencia configurable (día de semana, día de mes)

#### Máquinas (`/admin/machines`)
- CRUD de equipos del taller
- Estados: activa/mantenimiento/inactiva
- Seguimiento de próximo mantenimiento
- Alertas de mantenimiento próximo

#### Contabilidad (`/admin/accounting`)
- Registro de ingresos y gastos
- Filtros por tipo y fecha
- Resumen con totales
- Exportar CSV

#### Usuarios (`/admin/users`)
- Gestión de usuarios con roles (admin/gerente/empleado)
- Crear, editar, eliminar usuarios
- Badge de rol con colores (admin=rojo, gerente=amarillo, empleado=verde)
- Filtro por estado activo/inactivo
- Exportar CSV

#### Búsqueda Global (`Ctrl+K`)
- Busca en clientes, servicios y productos
- Resultados agrupados por categoría
- Navegación directa al resultado seleccionado

#### Atajos de Teclado
- `Ctrl+1-9`: Navegación rápida a secciones del admin
- `Ctrl+K`: Abrir búsqueda global
- `Escape`: Cerrar modales

#### Disponibilidad (`/admin/availability`)
- Gestión de horarios por día de la semana
- Bloqueo de fechas específicas (feriados, vacaciones)

## Seguridad

- **Middleware**: Protege todas las rutas `/admin/*`, redirige a login si no autenticado
- **RLS (Row Level Security)**: Políticas restrictivas en todas las tablas
- **Supabase Auth**: Sesiones manejadas via cookies (no localStorage)
- **Closure del admin**: Bloqueado por robots.txt
- **Roles de usuario**: Soporte para admin/gerente/empleado via tabla profiles

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
2. `supabase/full-migration.sql` (tablas nuevas: machines, recurrences, transactions, profiles)
3. `supabase/security-migration.sql` (políticas RLS seguras)

### 4. Crear usuario admin
1. Ir a **Supabase > Authentication > Users > Add User**
2. Email: `admin@fullshine.com` (o el que quieras)
3. Contraseña: una contraseña segura
4. Marcar **Auto Confirm User**
5. Crear registro en tabla `profiles` con rol `admin`

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
