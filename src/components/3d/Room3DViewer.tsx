import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import * as THREE from 'three';
import { Device, Room } from '../../types/iot';
import { colors } from '../../utils/colors';

interface Room3DViewerProps {
  room?: Room;
  devices: Device[];
  onSelectDevice?: (device: Device) => void;
  selectedDeviceId?: string;
  height?: number;
}

export const Room3DViewer: React.FC<Room3DViewerProps> = ({
  room,
  devices,
  onSelectDevice,
  selectedDeviceId,
  height = 360,
}) => {
  const mountRef = useRef<any>(null);
  const [activeDevice, setActiveDevice] = useState<Device | null>(null);
  const [cameraAngle, setCameraAngle] = useState<'iso' | 'top' | 'front'>('iso');

  useEffect(() => {
    // Only run Three.js direct canvas on web
    if (Platform.OS !== 'web' || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const containerHeight = height;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Slate 50 to match light theme

    const camera = new THREE.PerspectiveCamera(45, width / containerHeight, 0.1, 1000);
    camera.position.set(10, 9, 12);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, containerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(8, 14, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x6366f1, 0.8, 15);
    pointLight.position.set(0, 3.5, 0);
    scene.add(pointLight);

    // 3. Room Floor & Walls
    const roomWidth = room?.dimensions?.width || 8;
    const roomLength = room?.dimensions?.length || 6;
    const roomHeight = room?.dimensions?.height || 3;

    // Floor
    const floorGeo = new THREE.BoxGeometry(roomWidth, 0.2, roomLength);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.4,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor Grid Helper
    const grid = new THREE.GridHelper(Math.max(roomWidth, roomLength), 10, 0xc7d2fe, 0xe2e8f0);
    grid.position.y = 0.01;
    scene.add(grid);

    // Back Wall
    const backWallGeo = new THREE.BoxGeometry(roomWidth, roomHeight, 0.15);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.8,
      transparent: true,
      opacity: 0.9,
    });
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, roomHeight / 2, -roomLength / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left Wall
    const leftWallGeo = new THREE.BoxGeometry(0.15, roomHeight, roomLength);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Conference / Office Table in center
    const tableGeo = new THREE.BoxGeometry(3.5, 0.1, 1.8);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 1.1, 0);
    table.castShadow = true;
    scene.add(table);

    // Table legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.1);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const legPositions = [
      [-1.6, 0.55, -0.7],
      [1.6, 0.55, -0.7],
      [-1.6, 0.55, 0.7],
      [1.6, 0.55, 0.7],
    ];
    legPositions.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, ly, lz);
      scene.add(leg);
    });

    // 4. Device 3D Meshes
    const deviceMeshes: { mesh: THREE.Object3D; device: Device }[] = [];

    devices.forEach((dev) => {
      const group = new THREE.Group();
      const pos = dev.position3D || { x: 0, y: 1, z: 0 };
      group.position.set(pos.x, pos.y, pos.z);

      // Color based on status and power
      let baseColor = 0x4f46e5; // Indigo
      if (dev.status === 'offline') baseColor = 0x94a3b8;
      else if (dev.status === 'warning') baseColor = 0xf59e0b;
      else if (dev.type === 'smart_plug' && dev.reportedState?.power === false) baseColor = 0x64748b;

      if (dev.type === 'thermostat') {
        // Wall-mounted thermostat block with glowing display
        const bodyGeo = new THREE.BoxGeometry(0.5, 0.5, 0.1);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        group.add(body);

        const screenGeo = new THREE.BoxGeometry(0.38, 0.38, 0.02);
        const screenMat = new THREE.MeshBasicMaterial({ color: baseColor });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.z = 0.06;
        group.add(screen);
      } else if (dev.type === 'smart_plug') {
        // Plug base with glowing indicator ring
        const plugGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.25, 16);
        const plugMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const plug = new THREE.Mesh(plugGeo, plugMat);
        plug.castShadow = true;
        group.add(plug);

        const ringGeo = new THREE.TorusGeometry(0.18, 0.03, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: dev.reportedState?.power ? 0x10b981 : 0x94a3b8,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.13;
        group.add(ring);
      } else if (dev.type === 'occupancy_sensor') {
        // Ceiling dome with detection cone
        const domeGeo = new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.rotation.x = Math.PI;
        group.add(dome);

        if (dev.reportedState?.occupied) {
          const coneGeo = new THREE.ConeGeometry(1.6, 2.2, 16, 1, true);
          const coneMat = new THREE.MeshBasicMaterial({
            color: 0x6366f1,
            transparent: true,
            opacity: 0.15,
            wireframe: true,
          });
          const cone = new THREE.Mesh(coneGeo, coneMat);
          cone.position.y = -1.1;
          group.add(cone);
        }
      } else {
        // Sensor cube / pill
        const sensorGeo = new THREE.BoxGeometry(0.3, 0.3, 0.15);
        const sensorMat = new THREE.MeshStandardMaterial({ color: baseColor });
        const sensor = new THREE.Mesh(sensorGeo, sensorMat);
        sensor.castShadow = true;
        group.add(sensor);
      }

      // Marker sphere indicator on top
      const beaconGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: dev.status === 'online' ? 0x10b981 : dev.status === 'warning' ? 0xf59e0b : 0xef4444,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 0.35;
      group.add(beacon);

      scene.add(group);
      deviceMeshes.push({ mesh: group, device: dev });
    });

    // 5. Animation & Interaction Loop
    let animationFrameId: number;
    let rotationAngle = 0;
    let isInteracting = false;
    let prevMouseX = 0;

    const onMouseDown = (e: MouseEvent) => {
      isInteracting = true;
      prevMouseX = e.clientX;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isInteracting) return;
      const deltaX = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      rotationAngle += deltaX * 0.005;
    };

    const onMouseUp = () => {
      isInteracting = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Raycaster for clicking 3D devices
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = domEl.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hitables = deviceMeshes.map((dm) => dm.mesh);
      const intersects = raycaster.intersectObjects(hitables, true);

      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && hitObj.parent && hitObj.parent !== scene) {
          hitObj = hitObj.parent;
        }
        const match = deviceMeshes.find((dm) => dm.mesh === hitObj);
        if (match) {
          setActiveDevice(match.device);
          onSelectDevice?.(match.device);
        }
      }
    };

    domEl.addEventListener('click', onClick);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Subtle slow auto rotation when not dragging
      if (!isInteracting) {
        rotationAngle += 0.001;
      }

      // Smooth camera position based on rotationAngle and cameraAngle
      const radius = 15;
      if (cameraAngle === 'iso') {
        camera.position.x = Math.sin(rotationAngle) * radius;
        camera.position.z = Math.cos(rotationAngle) * radius;
        camera.position.y = 8.5;
      } else if (cameraAngle === 'top') {
        camera.position.set(0.1, 18, 0.1);
      } else if (cameraAngle === 'front') {
        camera.position.set(0, 3, 14);
      }

      camera.lookAt(0, 1.2, 0);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('click', onClick);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.innerHTML = '';
      }
    };
  }, [room, devices, cameraAngle, height]);

  return (
    <View style={[styles.container, { height }]}>
      {/* 3D WebGL Canvas Container */}
      <View
        // @ts-ignore
        ref={mountRef}
        style={styles.canvasContainer}
      />

      {/* Floating Camera Angle Selector & Controls */}
      <View style={styles.controlsBar}>
        <View style={styles.viewModeGroup}>
          <TouchableOpacity
            style={[styles.modeButton, cameraAngle === 'iso' && styles.modeButtonActive]}
            onPress={() => setCameraAngle('iso')}
          >
            <Text style={[styles.modeButtonText, cameraAngle === 'iso' && styles.modeButtonTextActive]}>
              Isometric
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, cameraAngle === 'top' && styles.modeButtonActive]}
            onPress={() => setCameraAngle('top')}
          >
            <Text style={[styles.modeButtonText, cameraAngle === 'top' && styles.modeButtonTextActive]}>
              Top View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, cameraAngle === 'front' && styles.modeButtonActive]}
            onPress={() => setCameraAngle('front')}
          >
            <Text style={[styles.modeButtonText, cameraAngle === 'front' && styles.modeButtonTextActive]}>
              Front View
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.online }]} />
            <Text style={styles.legendText}>Online ({devices.filter((d) => d.status === 'online').length})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>Warning ({devices.filter((d) => d.status === 'warning').length})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.offline }]} />
            <Text style={styles.legendText}>Offline ({devices.filter((d) => d.status === 'offline').length})</Text>
          </View>
        </View>
      </View>

      {/* Selected device overlay badge */}
      {activeDevice && (
        <View style={styles.activeDeviceBadge}>
          <View style={styles.badgeHeader}>
            <Text style={styles.badgeTitle}>{activeDevice.name}</Text>
            <TouchableOpacity onPress={() => setActiveDevice(null)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.badgeSub}>
            Type: {activeDevice.type.replace('_', ' ')} • Status: {activeDevice.status}
          </Text>
          {activeDevice.type === 'thermostat' && (
            <Text style={styles.badgeDetail}>
              Current: {activeDevice.reportedState?.current_temperature}°C | Target:{' '}
              {activeDevice.desiredState?.target_temperature}°C
            </Text>
          )}
          {activeDevice.type === 'smart_plug' && (
            <Text style={styles.badgeDetail}>
              Power: {activeDevice.reportedState?.power ? 'ON' : 'OFF'} ({activeDevice.reportedState?.current_watts || 0}W)
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
    position: 'relative',
  },
  canvasContainer: {
    width: '100%',
    height: '100%',
  },
  controlsBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    pointerEvents: 'box-none',
  },
  viewModeGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeButtonTextActive: {
    color: colors.textInverse,
  },
  legend: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeDeviceBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 240,
  },
  badgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeText: {
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: 4,
  },
  badgeSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  badgeDetail: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
});
