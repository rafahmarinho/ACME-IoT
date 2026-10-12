-- ====================================================================
-- ACME IoT Database Schema (Supabase / PostgreSQL)
-- ====================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Organizations
create table if not exists public.organizations (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text unique not null,
    plan text default 'Enterprise' check (plan in ('Starter', 'Professional', 'Enterprise')),
    address text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. User Profiles
create table if not exists public.user_profiles (
    id uuid primary key default uuid_generate_v4(),
    auth_user_id uuid references auth.users(id) on delete set null,
    email text unique not null,
    full_name text not null,
    role text not null check (role in ('owner', 'admin', 'operator', 'viewer')),
    organization_id uuid references public.organizations(id) on delete cascade,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Buildings
create table if not exists public.buildings (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    name text not null,
    address text not null,
    floors_count integer default 1,
    total_area_sqm numeric(10, 2) default 500.0,
    status text default 'operational' check (status in ('operational', 'maintenance', 'warning')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Rooms
create table if not exists public.rooms (
    id uuid primary key default uuid_generate_v4(),
    building_id uuid references public.buildings(id) on delete cascade not null,
    name text not null,
    floor integer default 1,
    room_type text default 'office' check (room_type in ('office', 'conference', 'server_room', 'breakroom', 'lab')),
    target_temp numeric(4, 1) default 21.5,
    target_humidity numeric(4, 1) default 45.0,
    dimensions jsonb default '{"width": 8, "length": 6, "height": 3}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Devices
create table if not exists public.devices (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    room_id uuid references public.rooms(id) on delete set null,
    name text not null,
    serial_number text unique not null,
    enrollment_code text not null,
    type text not null check (type in ('thermostat', 'smart_plug', 'temperature_sensor', 'humidity_sensor', 'occupancy_sensor')),
    status text not null default 'online' check (status in ('online', 'offline', 'warning', 'updating')),
    battery_level integer check (battery_level is null or (battery_level >= 0 and battery_level <= 100)),
    signal_strength integer default -55,
    firmware_version text not null default 'v2.4.0',
    target_firmware_version text,
    firmware_status text default 'up_to_date' check (firmware_status in ('up_to_date', 'update_pending', 'installing', 'rollback_ready', 'rolled_back')),
    firmware_progress integer default 0 check (firmware_progress between 0 and 100),
    desired_state jsonb not null default '{}'::jsonb,
    reported_state jsonb not null default '{}'::jsonb,
    is_reconnecting boolean default false,
    position_3d jsonb default '{"x": 0, "y": 1.2, "z": 0}'::jsonb,
    last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Device Telemetry Readings (Timeseries)
create table if not exists public.device_telemetry (
    id uuid primary key default uuid_generate_v4(),
    device_id uuid references public.devices(id) on delete cascade not null,
    metric text not null,
    value numeric(10, 2) not null,
    unit text not null,
    recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Automations
create table if not exists public.automations (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    name text not null,
    description text,
    is_active boolean default true,
    trigger_device_id uuid references public.devices(id) on delete cascade,
    condition_type text not null check (condition_type in ('temperature_above', 'temperature_below', 'occupancy_true', 'occupancy_false', 'power_above')),
    condition_value numeric(10, 2) not null,
    action_device_id uuid references public.devices(id) on delete cascade,
    action_type text not null check (action_type in ('set_temperature', 'toggle_power', 'send_alert')),
    action_payload jsonb not null default '{}'::jsonb,
    interval_minutes integer default 15,
    last_triggered_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Automation Logs
create table if not exists public.automation_logs (
    id uuid primary key default uuid_generate_v4(),
    automation_id uuid references public.automations(id) on delete cascade not null,
    trigger_value numeric(10, 2),
    action_taken text not null,
    status text not null check (status in ('success', 'failed', 'skipped_cooldown')),
    executed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Alerts
create table if not exists public.alerts (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    device_id uuid references public.devices(id) on delete cascade,
    severity text not null check (severity in ('critical', 'warning', 'info')),
    title text not null,
    message text not null,
    status text not null default 'active' check (status in ('active', 'acknowledged', 'resolved')),
    acknowledged_by text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    resolved_at timestamp with time zone
);

-- 10. Audit / Event Logs
create table if not exists public.events (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    device_id uuid references public.devices(id) on delete set null,
    category text not null check (category in ('telemetry', 'control', 'alert', 'firmware', 'enrollment', 'system')),
    message text not null,
    payload jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Firmware Catalog
create table if not exists public.firmware_releases (
    id uuid primary key default uuid_generate_v4(),
    version text not null,
    device_type text not null,
    release_notes text,
    download_url text,
    is_stable boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. External Integrations
create table if not exists public.integrations (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    type text not null check (type in ('webhook', 'slack', 'bacnet', 'aws_iot')),
    name text not null,
    config jsonb default '{}'::jsonb,
    is_enabled boolean default true,
    last_sync_at timestamp with time zone,
    status text default 'healthy' check (status in ('healthy', 'warning', 'error')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_devices_org on public.devices(organization_id);
create index if not exists idx_devices_room on public.devices(room_id);
create index if not exists idx_rooms_building on public.rooms(building_id);
create index if not exists idx_telemetry_device on public.device_telemetry(device_id, recorded_at desc);
create index if not exists idx_events_org on public.events(organization_id, created_at desc);
create index if not exists idx_alerts_org on public.alerts(organization_id, status);

-- Enable Row Level Security (RLS) on all tables
alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.buildings enable row level security;
alter table public.rooms enable row level security;
alter table public.devices enable row level security;
alter table public.device_telemetry enable row level security;
alter table public.automations enable row level security;
alter table public.automation_logs enable row level security;
alter table public.alerts enable row level security;
alter table public.events enable row level security;
alter table public.firmware_releases enable row level security;
alter table public.integrations enable row level security;

-- Permissive public read & authenticated write policies for demo/production flexibility
create policy "Allow read access for authenticated and anon users" on public.organizations for select using (true);
create policy "Allow read access for user profiles" on public.user_profiles for select using (true);
create policy "Allow write access for user profiles" on public.user_profiles for all using (true);
create policy "Allow all on buildings" on public.buildings for all using (true);
create policy "Allow all on rooms" on public.rooms for all using (true);
create policy "Allow all on devices" on public.devices for all using (true);
create policy "Allow all on telemetry" on public.device_telemetry for all using (true);
create policy "Allow all on automations" on public.automations for all using (true);
create policy "Allow all on automation logs" on public.automation_logs for all using (true);
create policy "Allow all on alerts" on public.alerts for all using (true);
create policy "Allow all on events" on public.events for all using (true);
create policy "Allow all on firmware" on public.firmware_releases for all using (true);
create policy "Allow all on integrations" on public.integrations for all using (true);

-- Realtime replication setup
alter publication supabase_realtime add table public.devices;
alter publication supabase_realtime add table public.alerts;
alter publication supabase_realtime add table public.events;
