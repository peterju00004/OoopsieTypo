import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import plusYellow from './assets/plus-yellow.svg';
import minusYellow from './assets/minus-yellow.svg';
import greenCircle from './assets/green-circle.png';
import whitePlus from './assets/+.png';
import whiteMinus from './assets/-.png';
import yellowBlock from './assets/yellow-block.svg';
import greenTransition from './assets/green-transition.png';

const loader = new GLTFLoader();

const App = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [selectedMeshInfo, setSelectedMeshInfo] = useState(null);


  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const cameraPositionRef = useRef({ x: 0, z: 2 });
  const animationFrameRef = useRef(null);
  const cube2Ref = useRef(null);
  const isMouseDown = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const lastFrameTimestamp = useRef(0);
  const isAnimating = useRef(false);
  const digitalScreenRef = useRef(null);
  const bookShelfRef = useRef(null);

  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseVectorRef = useRef(new THREE.Vector2());

  const cameraPositions = [
    { x: 0, z: 2 },
    { x: 2, z: 2 },
    { x: 0, z: 4 },
    { x: -2, z: 2 },
  ];

  const meshDescriptions = {
    'Digital Screen': 'This is the description for digital screen',
    'Book Shelf': 'This is the description for book shelf',
  };

  const handleModelClick = useCallback((event) => {
    if (!cameraRef.current || !sceneRef.current || !digitalScreenRef.current) return;

    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();

    mouseVectorRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseVectorRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseVectorRef.current, cameraRef.current);

    const objectsToTest = [];
    if (digitalScreenRef.current) objectsToTest.push(digitalScreenRef.current);
    if (bookShelfRef.current) objectsToTest.push(bookShelfRef.current);

    const intersects = raycasterRef.current.intersectObjects(objectsToTest, true);

    if (intersects.length > 0) {
      console.log('Model clicked!');
      console.log('Click position:', intersects[0].point);
      console.log('Distance from camera:', intersects[0].object);

      const clickedMesh = intersects[0].object;
      const meshName = clickedMesh.name || 'unknown';
      const description = meshDescriptions[meshName] || 'No description available';

      setSelectedMeshInfo({
        name: meshName,
        description: description
      });

      setRightPanelOpen(true);

      clickedMesh.material.emissive = new THREE.Color(0x888888);
      setTimeout(() => {
        clickedMesh.material.emissive = new THREE.Color(0x000000);
      }, 500);
    }
  }, []);

  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isMouseDown.current || !cameraRef.current) return;

    const timestamp = performance.now();
    if (timestamp - lastFrameTimestamp.current < 16) return;

    const camera = cameraRef.current;
    const deltaX = e.clientX - lastMousePosition.current.x;
    const deltaY = e.clientY - lastMousePosition.current.y;

    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;

    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(deltaX * 0.002);

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();

    if (Math.abs(deltaY) > 0.5) {
      rotationMatrix.multiply(
        new THREE.Matrix4().makeRotationAxis(right, deltaY * 0.002)
      );
    }

    const lookDirection = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(camera.quaternion)
      .applyMatrix4(rotationMatrix);

    camera.lookAt(
      camera.position.x + lookDirection.x,
      camera.position.y + lookDirection.y,
      camera.position.z + lookDirection.z
    );

    lastMousePosition.current = { x: e.clientX, y: e.clientY };
    lastFrameTimestamp.current = timestamp;
  }, []);

  const handleResize = useCallback((camera, renderer) => {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, []);

  const goToNextPosition = () => {
    setCurrentPositionIndex((current) => (current + 1) % cameraPositions.length);
  };

  const goToPreviousPosition = () => {
    setCurrentPositionIndex((current) =>
      (current - 1 + cameraPositions.length) % cameraPositions.length
    );
  };

  useEffect(() => {
    const canvas = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkMode ? 0x000000 : 0xFFFFFF);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
      stencil: false
    });

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    camera.position.set(cameraPositionRef.current.x, 0, cameraPositionRef.current.z);
    scene.add(camera);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.physicallyCorrectLights = false;
    canvas.appendChild(renderer.domElement);

    const handleMouseDown = (e) => {
      isMouseDown.current = true;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleModelClick);

    const light = new THREE.DirectionalLight(0xFFFFFF, 3);
    light.position.set(-1, 2, 4);
    scene.add(light);

    const geometry2 = new THREE.SphereGeometry(1, 32, 16);
    const material2 = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
    const cube2 = new THREE.Mesh(geometry2, material2);
    cube2.position.set(5, 0, 0);
    scene.add(cube2);
    cube2Ref.current = cube2;

    loader.load("./models/digital-screen.glb", (gltf) => {
      const model = gltf.scene;

      model.position.set(0, -2, 0);
      model.rotation.set(0, -Math.PI / 2, 0);
      model.scale.set(0.5, 0.5, 0.5);

      model.name = 'Digital Screen';
      model.traverse((child) => {
        if (child.isMesh) {
          child.name = 'Digital Screen';
        }
      });

      scene.add(model);
      digitalScreenRef.current = model;
    }, undefined, (error) => {
      console.error(error);
    });

    loader.load("./models/book-shelf.glb", (gltf) => {
      const model = gltf.scene;

      model.position.set(-5, -2, 0);
      model.rotation.set(0, Math.PI / 2, 0);
      model.scale.set(0.5, 0.5, 0.5);

      model.name = "Book Shelf";
      model.traverse((child) => {
        if (child.isMesh) {
          child.name = 'Book Shelf';
        }
      });

      scene.add(model);
      bookShelfRef.current = model;
    }, undefined, (error) => {
      console.error(error);
    });

    animate();

    const debouncedResize = debounce(
      () => handleResize(camera, renderer),
      100
    );
    window.addEventListener('resize', debouncedResize);

    const handleZoomIn = () => {
      if (!camera) return;
      camera.fov = Math.max(camera.fov - 5, 30);
      camera.updateProjectionMatrix();
    };

    const handleZoomOut = () => {
      if (!camera) return;
      camera.fov = Math.min(camera.fov + 5, 90);
      camera.updateProjectionMatrix();
    };

    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    if (zoomInButton) zoomInButton.addEventListener('click', handleZoomIn);
    if (zoomOutButton) zoomOutButton.addEventListener('click', handleZoomOut);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      geometry2.dispose();
      material2.dispose();
      window.removeEventListener('resize', debouncedResize);
      if (zoomInButton) zoomInButton.removeEventListener('click', handleZoomIn);
      if (zoomOutButton) zoomOutButton.removeEventListener('click', handleZoomOut);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleModelClick);
    };
  }, [animate, handleMouseMove, handleResize, handleModelClick]);

  useEffect(() => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;
    const targetPosition = cameraPositions[currentPositionIndex];
    let lastTime = 0;

    const updatePosition = (timestamp) => {
      if (timestamp - lastTime < 16) {
        if (isAnimating.current) {
          requestAnimationFrame(updatePosition);
        }
        return;
      }
      const dx = targetPosition.x - camera.position.x;
      const dz = targetPosition.z - camera.position.z;

      if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
        camera.position.x += dx * 0.1;
        camera.position.z += dz * 0.1;
        isAnimating.current = true;
        requestAnimationFrame(updatePosition);
      } else {
        camera.position.x = targetPosition.x;
        camera.position.z = targetPosition.z;
        isAnimating.current = false;
      }
      lastTime = timestamp;
    };

    isAnimating.current = true;
    requestAnimationFrame(updatePosition);

    return () => {
      isAnimating.current = false;
    };
  }, [currentPositionIndex]);

  useEffect(() => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;
    const targetX = menuOpen ? -1.5 : 0;
    let lastTime = 0;

    const updatePosition = (timestamp) => {
      if (timestamp - lastTime < 16) {
        if (isAnimating.current) {
          requestAnimationFrame(updatePosition);
        }
        return;
      }

      const dx = targetX - camera.position.x;
      if (Math.abs(dx) > 0.01) {
        camera.position.x += dx * 0.1;
        isAnimating.current = true;
        requestAnimationFrame(updatePosition);
      } else {
        camera.position.x = targetX;
        isAnimating.current = false;
      }
      lastTime = timestamp;
    };

    isAnimating.current = true;
    requestAnimationFrame(updatePosition);

    return () => {
      isAnimating.current = false;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (sceneRef.current) {
      const bgColor = isDarkMode ? 0x000000 : 0xFFFFFF;
      sceneRef.current.background = new THREE.Color(bgColor);

      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleEnterKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setMenuOpen(!menuOpen);
      e.preventDefault();
    }
  };

  const debounce = (fn, ms) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  };

  return (
    <div className={isDarkMode ? 'dark-mode' : ''}>
      <div
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        tabIndex={0}
        onKeyDown={handleEnterKeyDown}
        role='button'
        aria-label='Toggle menu'
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      <button className='fasms'>
        <div className='button-content'>
          <img src={yellowBlock} alt="Switch between full and simple version" className='yellow-block' />
          <img src={greenTransition} alt="" className='green-transition' />
        </div>
      </button>

      <div className={`left-side-panel ${menuOpen ? 'open' : ''}`}>
        <nav>
          <ul>
          </ul>
        </nav>
      </div>

      <div id="canvas-container"></div>

      <div className={`navigation-controls ${menuOpen}`}>
        <button className="control-button" onClick={goToPreviousPosition}>←</button>
        <button className='control-button' onClick={goToNextPosition}>→</button>
      </div>

      <div className='controls'>
        <button id='zoom-in' className='control-button zoom-button'>
          <div className='button-content'>
            <img src={plusYellow} alt="Zoom in" className='default-icon' />
            <img src={greenCircle} alt="" className='hover-icon' />
            <img src={whitePlus} alt="" className='white-symbol' />
          </div>
        </button>
        <button id='zoom-out' className='control-button zoom-button'>
          <div className='button-content'>
            <img src={minusYellow} alt="Zoom out" className='default-icon' />
            <img src={greenCircle} alt="" className='hover-icon' />
            <img src={whiteMinus} alt="" className='white-symbol' />
          </div>
        </button>
        <button onClick={toggleTheme} className='control-button'></button>
      </div>

      <div className={`right-side-panel ${rightPanelOpen ? 'open' : ''}`}>
        {selectedMeshInfo && (
          <>
            <button
              className="close-button"
              onClick={() => setRightPanelOpen(false)}
              aria-label="Close description panel"
            >
              ×
            </button>
            <h2>{selectedMeshInfo.name}</h2>
            <p>{selectedMeshInfo.description}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default App;