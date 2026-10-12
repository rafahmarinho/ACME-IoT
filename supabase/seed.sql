-- ====================================================================
-- ACME IoT Demo Seed Data (Supabase / PostgreSQL)
-- 2 Organizations, 20 Devices, Automations, Alerts, Telemetry & Firmware
-- ====================================================================

-- 1. Insert Organizations
insert into public.organizations (id, name, slug, plan, address)
values
    ('11111111-1111-1111-1111-111111111111', 'ACME Global Headquarters', 'acme-hq', 'Enterprise', '100 Silicon Boulevard, San Jose, CA, USA'),
    ('22222222-2222-2222-2222-222222222222', 'Apex Logistics & Tech Park', 'apex-logistics', 'Professional', '450 Freight Way, Chicago, IL, USA')
on conflict (id) do nothing;

-- 2. Insert User Profiles for Roles (Owner, Admin, Operator, Viewer)
insert into public.user_profiles (id, email, full_name, role, organization_id, avatar_url)
values
    ('a1111111-0000-0000-0000-000000000001', 'owner@acme-iot.com', 'Sarah Jenkins', 'owner', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
    ('a1111111-0000-0000-0000-000000000002', 'admin@acme-iot.com', 'Marcus Vance', 'admin', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
    ('a1111111-0000-0000-0000-000000000003', 'operator@acme-iot.com', 'Elena Rostova', 'operator', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
    ('a1111111-0000-0000-0000-000000000004', 'viewer@acme-iot.com', 'David Kim', 'viewer', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150')
on conflict (id) do nothing;

-- 3. Insert Buildings
insert into public.buildings (id, organization_id, name, address, floors_count, total_area_sqm, status)
values
    ('b1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Tower One - Innovation Center', '100 Silicon Blvd, Tower 1', 12, 14200.0, 'operational'),
    ('b1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Tower Two - R&D Lab', '100 Silicon Blvd, Tower 2', 6, 8500.0, 'operational'),
    ('b2222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Cold Chain Warehouse A', '450 Freight Way, Dock 1-10', 2, 22000.0, 'operational'),
    ('b2222222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Distribution Bay B', '450 Freight Way, Dock 11-25', 1, 18500.0, 'warning')
on conflict (id) do nothing;

-- 4. Insert Rooms (ids must be valid hex UUIDs: 'r...' is not accepted by Postgres)
insert into public.rooms (id, building_id, name, floor, room_type, target_temp, target_humidity, dimensions)
values
    ('aa111111-0000-0000-0000-000000000001', 'b1111111-0000-0000-0000-000000000001', 'Executive Boardroom', 4, 'conference', 21.5, 45.0, '{"width": 10, "length": 8, "height": 3.2}'::jsonb),
    ('aa111111-0000-0000-0000-000000000002', 'b1111111-0000-0000-0000-000000000001', 'Server & Network Hub', 1, 'server_room', 18.0, 38.0, '{"width": 8, "length": 7, "height": 3.0}'::jsonb),
    ('aa111111-0000-0000-0000-000000000003', 'b1111111-0000-0000-0000-000000000001', 'Open Engineering Space', 3, 'office', 22.0, 48.0, '{"width": 18, "length": 14, "height": 3.5}'::jsonb),
    ('aa222222-0000-0000-0000-000000000001', 'b2222222-0000-0000-0000-000000000001', 'Pharma Cold Storage', 1, 'lab', 4.0, 55.0, '{"width": 15, "length": 12, "height": 4.0}'::jsonb),
    ('aa222222-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000002', 'Loading Dock & Staging', 1, 'breakroom', 19.0, 50.0, '{"width": 25, "length": 20, "height": 6.0}'::jsonb)
on conflict (id) do nothing;

-- 5. Insert 20 Devices across 2 Organizations
insert into public.devices (
    id, organization_id, room_id, name, serial_number, enrollment_code,
    type, status, battery_level, signal_strength, firmware_version, target_firmware_version,
    firmware_status, firmware_progress, desired_state, reported_state, is_reconnecting, position_3d, last_seen_at
)
values
    -- Org 1, Room 1 (Executive Boardroom)
    (
        'd1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aa111111-0000-0000-0000-000000000001',
        'Boardroom Thermostat Pro', 'ACME-TH-001', 'ENR-TH-9021',
        'thermostat', 'online', null, -52, 'v2.4.0', null,
        'up_to_date', 0,
        '{"target_temperature": 21.5, "mode": "cool", "fan": "auto"}'::jsonb,
        '{"current_temperature": 22.1, "target_temperature": 21.5, "mode": "cool", "fan": "auto", "humidity": 45.2}'::jsonb,
        false, '{"x": -3.5, "y": 1.5, "z": -2.0}'::jsonb, now()
    ),
    (
        'd1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'aa111111-0000-0000-0000-000000000001',
        'AV & Display Smart Plug', 'ACME-PLUG-001', 'ENR-PL-4431',
        'smart_plug', 'online', null, -58, 'v2.3.8', 'v2.4.0',
        'update_pending', 0,
        '{"power": true}'::jsonb,
        '{"power": true, "voltage": 121.4, "current_watts": 240.5, "energy_kwh": 14.8}'::jsonb,
        false, '{"x": 2.8, "y": 0.4, "z": -2.5}'::jsonb, now()
    ),
    (
        'd1111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'aa111111-0000-0000-0000-000000000001',
        'Ceiling Occupancy Sensor', 'ACME-OCC-001', 'ENR-OC-1102',
        'occupancy_sensor', 'online', 82, -64, 'v1.9.4', null,
        'up_to_date', 0,
        '{"sensitivity": "high"}'::jsonb,
        '{"occupied": true, "motion_count_today": 14, "last_motion_at": "2026-10-11T14:32:00Z"}'::jsonb,
        false, '{"x": 0.0, "y": 3.0, "z": 0.0}'::jsonb, now()
    ),
    (
        'd1111111-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'aa111111-0000-0000-0000-000000000001',
        'South Window Temp Sensor', 'ACME-TMP-001', 'ENR-TS-5509',
        'temperature_sensor', 'online', 74, -60, 'v1.8.2', null,
        'up_to_date', 0,
        '{"sample_rate_sec": 60}'::jsonb,
        '{"temperature": 22.3, "min_24h": 20.1, "max_24h": 23.8}'::jsonb,
        false, '{"x": 3.8, "y": 1.2, "z": 1.5}'::jsonb, now()
    ),
    (
        'd1111111-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'aa111111-0000-0000-0000-000000000001',
        'Ambient Humidity Probe', 'ACME-HUM-001', 'ENR-HM-7781',
        'humidity_sensor', 'online', 69, -67, 'v1.8.2', null,
        'up_to_date', 0,
        '{"sample_rate_sec": 60}'::jsonb,
        '{"humidity": 46.0, "dew_point": 9.8}'::jsonb,
        false, '{"x": -3.8, "y": 1.4, "z": 1.0}'::jsonb, now()
    ),

    -- Org 1, Room 2 (Server & Network Hub)
    (
        'd1111111-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'aa111111-0000-0000-0000-000000000002',
        'Server Room Precision AC', 'ACME-TH-002', 'ENR-TH-8812',
        'thermostat', 'online', null, -48, 'v2.4.0', null,
        'up_to_date', 0,
        '{"target_temperature": 18.0, "mode": "cool", "fan": "high"}'::jsonb,
        '{"current_temperature": 18.4, "target_temperature": 18.0, "mode": "cool", "fan": "high", "humidity": 38.0}'::jsonb,
        false, '{"x": -2.8, "y": 1.6, "z": -2.2}'::jsonb, now()
    ),
    (
        'd1111111-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'aa111111-0000-0000-0000-000000000002',
        'Rack 01 Primary PDU Plug', 'ACME-PLUG-002', 'ENR-PL-9022',
        'smart_plug', 'online', null, -45, 'v2.4.0', null,
        'up_to_date', 0,
        '{"power": true}'::jsonb,
        '{"power": true, "voltage": 208.1, "current_watts": 890.0, "energy_kwh": 312.4}'::jsonb,
        false, '{"x": 1.5, "y": 0.5, "z": -1.8}'::jsonb, now()
    ),
    (
        'd1111111-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'aa111111-0000-0000-0000-000000000002',
        'Rack Intake Temp Sensor', 'ACME-TMP-002', 'ENR-TS-9943',
        'temperature_sensor', 'online', 90, -50, 'v1.8.2', null,
        'up_to_date', 0,
        '{"sample_rate_sec": 30}'::jsonb,
        '{"temperature": 19.1, "min_24h": 17.9, "max_24h": 19.6}'::jsonb,
        false, '{"x": 1.5, "y": 1.8, "z": -1.6}'::jsonb, now()
    ),
    (
        'd1111111-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'aa111111-0000-0000-0000-000000000002',
        'Server Humidity Monitor', 'ACME-HUM-002', 'ENR-HM-4401',
        'humidity_sensor', 'online', 85, -55, 'v1.8.2', null,
        'up_to_date', 0,
        '{"sample_rate_sec": 30}'::jsonb,
        '{"humidity": 38.0, "dew_point": 3.8}'::jsonb,
        false, '{"x": -1.0, "y": 1.5, "z": 1.2}'::jsonb, now()
    ),
    (
        'd1111111-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'aa111111-0000-0000-0000-000000000002',
        'Server Hub Security Radar', 'ACME-OCC-002', 'ENR-OC-3310',
        'occupancy_sensor', 'online', 65, -58, 'v1.9.4', null,
        'up_to_date', 0,
        '{"sensitivity": "ultra"}'::jsonb,
        '{"occupied": false, "motion_count_today": 3, "last_motion_at": "2026-10-11T09:14:22Z"}'::jsonb,
        false, '{"x": 0.0, "y": 2.8, "z": 0.0}'::jsonb, now()
    ),

    -- Org 1, Room 3 (Open Engineering Space)
    (
        'd1111111-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'aa111111-0000-0000-0000-000000000003',
        'Floor Zone A Thermostat', 'ACME-TH-003', 'ENR-TH-7729',
        'thermostat', 'online', null, -54, 'v2.4.0', null,
        'up_to_date', 0,
        '{"target_temperature": 22.0, "mode": "cool", "fan": "auto"}'::jsonb,
        '{"current_temperature": 23.0, "target_temperature": 22.0, "mode": "cool", "fan": "auto", "humidity": 48.1}'::jsonb,
        false, '{"x": -4.2, "y": 1.5, "z": 0.0}'::jsonb, now()
    ),
    (
        'd1111111-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'aa111111-0000-0000-0000-000000000003',
        'Espresso Bar Smart Plug', 'ACME-PLUG-003', 'ENR-PL-5114',
        'smart_plug', 'online', null, -62, 'v2.3.8', null,
        'up_to_date', 0,
        '{"power": true}'::jsonb,
        '{"power": true, "voltage": 120.0, "current_watts": 1250.0, "energy_kwh": 89.2}'::jsonb,
        false, '{"x": 4.5, "y": 0.9, "z": 3.0}'::jsonb, now()
    ),
    (
        'd1111111-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'aa111111-0000-0000-0000-000000000003',
        'East Atrium Temp Sensor', 'ACME-TMP-003', 'ENR-TS-2039',
        'temperature_sensor', 'online', 58, -69, 'v1.8.2', null,
        'up_to_date', 0,
        '{"sample_rate_sec": 60}'::jsonb,
        '{"temperature": 23.2, "min_24h": 20.8, "max_24h": 24.1}'::jsonb,
        false, '{"x": 5.0, "y": 1.4, "z": -2.0}'::jsonb, now()
    ),
    (
        'd1111111-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'aa111111-0000-0000-0000-000000000003',
        'Engineering Motion Grid', 'ACME-OCC-003', 'ENR-OC-8891',
        'occupancy_sensor', 'online', 79, -59, 'v1.9.4', null,
        'up_to_date', 0,
        '{"sensitivity": "medium"}'::jsonb,
        '{"occupied": true, "motion_count_today": 62, "last_motion_at": "2026-10-11T14:48:10Z"}'::jsonb,
        false, '{"x": 0.0, "y": 3.2, "z": 0.0}'::jsonb, now()
    ),

    -- Org 2, Room 4 (Pharma Cold Storage)
    (
        'd2222222-0000-0000-0000-000000000015', '22222222-2222-2222-2222-222222222222', 'aa222222-0000-0000-0000-000000000001',
        'Cold Storage Unit A Chiller', 'ACME-TH-004', 'ENR-TH-4490',
        'thermostat', 'online', null, -50, 'v2.4.0', null,
        'up_to_date', 0,
        '{"target_temperature": 4.0, "mode": "cool", "fan": "high"}'::jsonb,
        '{"current_temperature": 4.2, "target_temperature": 4.0, "mode": "cool", "fan": "high", "humidity": 55.0}'::jsonb,
        false, '{"x": -4.0, "y": 2.0, "z": -3.0}'::jsonb, now()
    ),
    (
        'd2222222-0000-0000-0000-000000000016', '22222222-2222-2222-2222-222222222222', 'aa222222-0000-0000-0000-000000000001',
        'Cold Chain Pallet Probe', 'ACME-TMP-004', 'ENR-TS-9980',
        'temperature_sensor', 'online', 92, -58, 'v1.8.2', null,
        'up_to_date', 0,
        '{"sample_rate_sec": 15}'::jsonb,
        '{"temperature": 4.1, "min_24h": 3.8, "max_24h": 4.5}'::jsonb,
        false, '{"x": 0.0, "y": 1.0, "z": 0.0}'::jsonb, now()
    ),
    (
        'd2222222-0000-0000-0000-000000000017', '22222222-2222-2222-2222-222222222222', 'aa222222-0000-0000-0000-000000000001',
        'Cold Vault Humidity Probe', 'ACME-HUM-003', 'ENR-HM-2391',
        'humidity_sensor', 'online', 78, -63, 'v1.8.2', null,
        'up_to_date', 0,
        '{"sample_rate_sec": 30}'::jsonb,
        '{"humidity": 55.4, "dew_point": -4.1}'::jsonb,
        false, '{"x": 2.5, "y": 1.6, "z": 2.0}'::jsonb, now()
    ),
    (
        'd2222222-0000-0000-0000-000000000018', '22222222-2222-2222-2222-222222222222', 'aa222222-0000-0000-0000-000000000001',
        'Auxiliary Dehumidifier Plug', 'ACME-PLUG-004', 'ENR-PL-7703',
        'smart_plug', 'online', null, -59, 'v2.4.0', null,
        'up_to_date', 0,
        '{"power": false}'::jsonb,
        '{"power": false, "voltage": 120.2, "current_watts": 0.0, "energy_kwh": 41.5}'::jsonb,
        false, '{"x": -2.0, "y": 0.5, "z": 3.0}'::jsonb, now()
    ),

    -- Org 2, Room 5 (Loading Dock & Staging)
    -- Weak battery simulation (battery: 18%) & Warning status
    (
        'd2222222-0000-0000-0000-000000000019', '22222222-2222-2222-2222-222222222222', 'aa222222-0000-0000-0000-000000000002',
        'Dock Gate Occupancy Radar', 'ACME-OCC-004', 'ENR-OC-9904',
        'occupancy_sensor', 'warning', 18, -82, 'v1.9.4', null,
        'up_to_date', 0,
        '{"sensitivity": "high"}'::jsonb,
        '{"occupied": true, "motion_count_today": 128, "last_motion_at": "2026-10-11T14:50:00Z"}'::jsonb,
        false, '{"x": 0.0, "y": 4.0, "z": 2.0}'::jsonb, now()
    ),
    -- Shadow mismatch simulation (desired ON vs reported OFF) & Offline simulation
    (
        'd2222222-0000-0000-0000-000000000020', '22222222-2222-2222-2222-222222222222', 'aa222222-0000-0000-0000-000000000002',
        'Forklift Rapid Charger #1', 'ACME-PLUG-005', 'ENR-PL-0091',
        'smart_plug', 'offline', null, -95, 'v2.3.8', 'v2.4.0',
        'update_pending', 0,
        '{"power": true}'::jsonb,
        '{"power": false, "voltage": 0.0, "current_watts": 0.0, "energy_kwh": 512.0}'::jsonb,
        false, '{"x": 6.0, "y": 0.8, "z": -4.0}'::jsonb, now() - interval '4 hours'
    )
on conflict (id) do nothing;

-- 6. Insert Automations
insert into public.automations (
    id, organization_id, name, description, is_active,
    trigger_device_id, condition_type, condition_value,
    action_device_id, action_type, action_payload,
    interval_minutes, last_triggered_at
)
values
    (
        'c1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
        'Boardroom Overheat Cooling Boost', 'If window temp rises above 24°C, adjust thermostat to 21°C', true,
        'd1111111-0000-0000-0000-000000000004', 'temperature_above', 24.0,
        'd1111111-0000-0000-0000-000000000001', 'set_temperature', '{"target_temperature": 21.0, "mode": "cool"}'::jsonb,
        15, now() - interval '3 hours'
    ),
    (
        'c1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
        'Auto Power-Off AV on Vacancy', 'Turn off Boardroom display plug when room is vacant', true,
        'd1111111-0000-0000-0000-000000000003', 'occupancy_false', 0.0,
        'd1111111-0000-0000-0000-000000000002', 'toggle_power', '{"power": false}'::jsonb,
        30, null
    ),
    (
        'c2222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
        'Pharma Cold Chain Spike Alert', 'Send critical alert if cold pallet probe exceeds 6°C', true,
        'd2222222-0000-0000-0000-000000000016', 'temperature_above', 6.0,
        null, 'send_alert', '{"severity": "critical", "title": "Cold Chain Excursion", "message": "Temperature exceeded 6.0C in Pharma Cold Storage"}'::jsonb,
        5, null
    )
on conflict (id) do nothing;

-- 7. Insert Alerts
insert into public.alerts (id, organization_id, device_id, severity, title, message, status, created_at)
values
    (
        'e1111111-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
        'd2222222-0000-0000-0000-000000000019', 'warning', 'Low Battery Warning',
        'Dock Gate Occupancy Radar battery dropped to 18%. Replacement recommended within 7 days.',
        'active', now() - interval '2 hours'
    ),
    (
        'e1111111-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
        'd2222222-0000-0000-0000-000000000020', 'critical', 'Device Heartbeat Timeout',
        'Forklift Rapid Charger #1 has missed 8 heartbeat intervals. Reported state is offline.',
        'active', now() - interval '4 hours'
    ),
    (
        'e1111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
        'd1111111-0000-0000-0000-000000000002', 'info', 'Firmware Update Available',
        'New firmware v2.4.0 is ready for deployment on AV & Display Smart Plug.',
        'acknowledged', now() - interval '1 day'
    )
on conflict (id) do nothing;

-- 8. Insert Audit / Event Stream
insert into public.events (id, organization_id, device_id, category, message, payload, created_at)
values
    ('f1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'd1111111-0000-0000-0000-000000000001', 'control', 'Thermostat target temperature set to 21.5°C by operator Elena Rostova', '{"target_temperature": 21.5, "mode": "cool"}'::jsonb, now() - interval '30 minutes'),
    ('f1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'd1111111-0000-0000-0000-000000000002', 'telemetry', 'Smart plug telemetry received: 240.5W at 121.4V', '{"watts": 240.5, "volts": 121.4}'::jsonb, now() - interval '15 minutes'),
    ('f1111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'd1111111-0000-0000-0000-000000000003', 'telemetry', 'Motion detected in Executive Boardroom', '{"occupied": true}'::jsonb, now() - interval '5 minutes'),
    ('f1111111-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'd2222222-0000-0000-0000-000000000020', 'alert', 'Forklift Rapid Charger #1 disconnected from cellular gateway', '{"signal_dbm": -95}'::jsonb, now() - interval '4 hours'),
    ('f1111111-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'd1111111-0000-0000-0000-000000000007', 'telemetry', 'PDU load steady at 890W across 12 server blades', '{"watts": 890}'::jsonb, now() - interval '2 minutes')
on conflict (id) do nothing;

-- 9. Insert Firmware Releases Catalog
insert into public.firmware_releases (id, version, device_type, release_notes, download_url, is_stable)
values
    ('91111111-0000-0000-0000-000000000001', 'v2.4.1-rc', 'thermostat', 'PID temperature loop tuning and faster HTTP heartbeat retry interval.', 'https://updates.acme-iot.internal/fw/th-v2.4.1.bin', false),
    ('91111111-0000-0000-0000-000000000002', 'v2.4.0', 'thermostat', 'Production baseline: adaptive cooling curve and sleep timer.', 'https://updates.acme-iot.internal/fw/th-v2.4.0.bin', true),
    ('91111111-0000-0000-0000-000000000003', 'v2.4.0', 'smart_plug', 'Precision current transformer calibration & zero-cross switching.', 'https://updates.acme-iot.internal/fw/plug-v2.4.0.bin', true),
    ('91111111-0000-0000-0000-000000000004', 'v1.9.4', 'occupancy_sensor', 'PIR noise filtering and low-battery wake cycle optimizations.', 'https://updates.acme-iot.internal/fw/occ-v1.9.4.bin', true),
    ('91111111-0000-0000-0000-000000000005', 'v1.8.2', 'temperature_sensor', 'Thermistor cold-junction compensation and sub-second burst sampling.', 'https://updates.acme-iot.internal/fw/ts-v1.8.2.bin', true)
on conflict (id) do nothing;

-- 10. Insert External Integrations
insert into public.integrations (id, organization_id, type, name, config, is_enabled, status, last_sync_at)
values
    (
        '81111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
        'slack', 'Operations #iot-alerts Channel',
        '{"channel": "#iot-alerts", "webhook_url": "https://hooks.slack.com/services/SIMULATED/B01/IoTAlerts", "notify_severities": ["critical", "warning"]}'::jsonb,
        true, 'healthy', now() - interval '12 minutes'
    ),
    (
        '81111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
        'bacnet', 'Honeywell Building Management Gateway (BACnet/IP)',
        '{"ip": "192.168.10.250", "port": 47808, "device_instance": 1001, "sync_interval_sec": 30}'::jsonb,
        true, 'healthy', now() - interval '1 minute'
    ),
    (
        '81111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
        'aws_iot', 'AWS IoT Core Device Shadow Sync',
        '{"endpoint": "a3b9xyz123-ats.iot.us-west-2.amazonaws.com", "region": "us-west-2", "shadow_type": "named", "sync_direction": "bidirectional"}'::jsonb,
        true, 'healthy', now() - interval '4 minutes'
    ),
    (
        '82222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
        'webhook', 'Logistics ERP Telemetry Dispatcher',
        '{"url": "https://erp.apexlogistics.internal/api/v1/telemetry", "secret": "whsec_apex_iot_token_9918"}'::jsonb,
        true, 'healthy', now() - interval '7 minutes'
    )
on conflict (id) do nothing;
