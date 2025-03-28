import * as THREE from 'three';
import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import plusYellow from './assets/plus-yellow.svg';
import minusYellow from './assets/minus-yellow.svg';
import greenCircle from './assets/green-circle.png';
import whitePlus from './assets/+.png';
import whiteMinus from './assets/-.png';
import yellowBlock from './assets/yellow-block.svg';
import greenTransition from './assets/green-transition.png';

const App = () => {
  // States
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  
  // Refs
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const cameraPositionRef = useRef({x: 0, z: 2});
  const animationFrameRef = useRef(null);
  const cube1Ref = useRef(null);
  const cube2Ref = useRef(null);
  const isMouseDown = useRef(false);
  const lastMousePosition = useRef({x: 0, y: 0});
  const lastFrameTimestamp = useRef(0);
  const isAnimating = useRef(false);

  // Camera positions
  const cameraPositions = [
    { x: 0, z: 2 },
    { x: 2, z: 2 },
    { x: 0, z: 4 },
    { x: -2, z: 2},
  ];

  // Animation and event handlers
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

  // Navigation handlers
  const goToNextPosition = () => {
    setCurrentPositionIndex((current) => (current + 1) % cameraPositions.length);
  };

  const goToPreviousPosition = () => {
    setCurrentPositionIndex((current) => 
      (current - 1 + cameraPositions.length) % cameraPositions.length
    );
  };

  // Scene setup effect
  useEffect(() => {
    const canvas = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      powerPreference: "high-performance", 
      alpha: false,
      stencil: false
    });

    // Store refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Setup camera
    camera.position.set(cameraPositionRef.current.x, 0, cameraPositionRef.current.z);
    scene.add(camera);

    // Setup renderer
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.physicallyCorrectLights = false;
    canvas.appendChild(renderer.domElement);

    // Mouse event handlers
    const handleMouseDown = (e) => {
      isMouseDown.current = true;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    // Add event listeners
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // Setup lighting
    const light = new THREE.DirectionalLight(0xFFFFFF, 3);
    light.position.set(-1, 2, 4);
    scene.add(light);

    // Create geometries
    const geometry1 = new THREE.BoxGeometry(1, 1, 1);
    const material1 = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
    const cube1 = new THREE.Mesh(geometry1, material1);
    scene.add(cube1);
    cube1Ref.current = cube1;
    
    const geometry2 = new THREE.SphereGeometry(1, 32, 16);
    const material2 = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
    const cube2 = new THREE.Mesh(geometry2, material2);
    cube2.position.set(5, 0, 0);
    scene.add(cube2);
    cube2Ref.current = cube2;

    // Start animation
    animate();

    // Handle window resize
    const debouncedResize = debounce(
      () => handleResize(camera, renderer),
      100
    );
    window.addEventListener('resize', debouncedResize);

    // Zoom handlers
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

    // Add zoom listeners
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    if (zoomInButton) zoomInButton.addEventListener('click', handleZoomIn);
    if (zoomOutButton) zoomOutButton.addEventListener('click', handleZoomOut);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      geometry1.dispose();
      material1.dispose();
      geometry2.dispose();
      material2.dispose();
      window.removeEventListener('resize', debouncedResize);
      if (zoomInButton) zoomInButton.removeEventListener('click', handleZoomIn);
      if (zoomOutButton) zoomOutButton.removeEventListener('click', handleZoomOut);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [animate, handleMouseMove, handleResize]);

  // Camera position effect
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

  // Menu effect
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

  // Theme effect
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(isDarkMode ? 0x000000 : 0xFFFFFF);
    }
    if (cube1Ref.current) {
      cube1Ref.current.material.color.set(isDarkMode ? 0x88ccff : 0x44aa88);
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

  // Utility function for debouncing
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
          <img src={yellowBlock} alt="Switch between full and simple version" className='yellow-block'/>
          <img src={greenTransition} alt="" className='green-transition'/>
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
            <img src={plusYellow} alt="Zoom in" className='default-icon'/>
            <img src={greenCircle} alt="" className='hover-icon'/>
            <img src={whitePlus} alt="" className='white-symbol'/>
          </div>
        </button>
        <button id='zoom-out' className='control-button zoom-button'>
          <div className='button-content'>
            <img src={minusYellow} alt="Zoom out" className='default-icon'/>
            <img src={greenCircle} alt="" className='hover-icon'/>
            <img src={whiteMinus} alt="" className='white-symbol'/>
          </div>
        </button>
        <button onClick={toggleTheme} className='control-button'></button>
      </div>
    </div>
  );
};

export default App;