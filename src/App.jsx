import './App.css'
import { useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

gsap.registerPlugin(ScrollTrigger)

function App() {
  useEffect(() => {
    const scene = new THREE.Scene()

    const rgbeLoader = new RGBELoader()
    rgbeLoader.load('/studio.hdr', (texture) => {
      scene.environment = texture
      scene.background = texture
      texture.mapping = THREE.EquirectangularReflectionMapping

      // Reduce HDR intensity for performance
      texture.encoding = THREE.sRGBEncoding

      // Boost environment reflections (material realism)
      scene.environmentIntensity = 1.5
    })


    const container = document.getElementById('canvas-container')
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    )

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setClearColor(0x000000, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    const width2 = container.clientWidth || window.innerWidth
    const height2 = container.clientHeight || window.innerHeight
    renderer.setSize(width2, height2)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    container.appendChild(renderer.domElement)

    // Geometry
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    const cube = new THREE.Mesh(geometry, material)
    // scene.add(cube)

    // Lighting (realistic)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(2, 2, 2)
    scene.add(pointLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
    keyLight.position.set(3, 5, 2)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5)
    fillLight.position.set(-3, 2, -2)
    scene.add(fillLight)

    const spotLight = new THREE.SpotLight(0xffffff, 2)
    spotLight.position.set(0, 6, 4)
    spotLight.castShadow = true
    spotLight.angle = Math.PI / 6
    spotLight.penumbra = 0.5
    spotLight.decay = 2
    spotLight.distance = 20
    spotLight.shadow.mapSize.width = 1024
    spotLight.shadow.mapSize.height = 1024
    spotLight.shadow.radius = 4
    scene.add(spotLight)

    // Spotlight focus animation (subtle sweep)
    gsap.to(spotLight.position, {
      x: 2,
      y: 6,
      z: 3,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })

    camera.position.set(0, 1.5, 3)
    camera.lookAt(0, 0, 0)

    // Cinematic intro animation
    gsap.from(camera.position, {
      z: 6,
      duration: 2,
      ease: 'power3.out'
    })

    // Idle camera motion (subtle breathing)
    gsap.to(camera.position, {
      y: '+=0.2',
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })

    // Mouse interaction (OrbitControls)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.target.set(0, 1, 0)

    ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: '+=2000',
      onEnter: () => controls.enabled = false,
      onLeaveBack: () => controls.enabled = true,
      onLeave: () => controls.enabled = true,
      onEnterBack: () => controls.enabled = false
    })

    gsap.to(camera.position, {
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: '+=2000',
        scrub: true
      },
      keyframes: [
        { x: 0, y: 1.5, z: 3 },
        { x: 1, y: 1.8, z: 2.5 },
        { x: -1, y: 1.2, z: 2.2 },
        { x: 0, y: 1.5, z: 1.8 }
      ],
      ease: 'sine.inOut'
    })

    gsap.to(camera.position, {
      z: 1.8,
      scrollTrigger: {
        trigger: '#sections',
        start: 'top center',
        end: 'bottom center',
        scrub: true
      }
    })

    // Text animation
    gsap.from('.title', {
      y: 100,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    })

    gsap.from('.subtitle', {
      y: 50,
      opacity: 0,
      delay: 0.5,
      duration: 1,
      ease: 'power3.out'
    })

    // Load GLTF model
    const loader = new GLTFLoader()
    let modelRef = null
    let nikeModel = null

    function setupModel(model) {
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      model.position.sub(center)

      const size = box.getSize(new THREE.Vector3()).length()
      const scale = 3.5 / size
      model.scale.setScalar(scale)

      model.position.y += 1.2
    }


    // Load Nike (main model)
    loader.load('/nike_air720.glb', (gltf) => {
      const model = gltf.scene
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true

          if (child.material) {
            child.material.envMapIntensity = 1.5
            child.material.roughness = Math.max(0.2, child.material.roughness || 0.5)
            child.material.metalness = 0.3
          }
        }
      })
      setupModel(model)
      model.position.x = 0

      // Soft shadow (safe)
      const shadowTexture = new THREE.TextureLoader().load(
        'https://threejs.org/examples/textures/sprites/roundshadow.png'
      )
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.4
      })

      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, 2.5),
        shadowMat
      )
      shadowPlane.rotation.x = -Math.PI / 2
      shadowPlane.position.y = model.position.y - 1.2

      scene.add(shadowPlane)

      scene.add(model)
      document.getElementById('loader').style.display = 'none'

      modelRef = model
      nikeModel = model

      controls.target.copy(model.position)
      camera.lookAt(model.position)
    })

    // Raycaster for click-to-focus between models
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    const focusOn = (obj) => {
      const box = new THREE.Box3().setFromObject(obj)
      const center = box.getCenter(new THREE.Vector3())
      controls.target.copy(center)
      gsap.to(camera.position, {
        duration: 0.8,
        x: center.x,
        y: center.y + 0.8,
        z: center.z + 2.5,
        ease: 'power2.out'
      })
    }

    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(scene.children, true)
      if (intersects.length > 0) {
        let obj = intersects[0].object
        // climb to top-level model node
        while (obj.parent && obj.parent.type !== 'Scene') obj = obj.parent
        focusOn(obj)
      }
    }
    window.addEventListener('click', onClick)

    // Auto rotation + hover tilt
    let mouseX = 0
    let mouseY = 0

    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1
      mouseY = (e.clientY / window.innerHeight) * 2 - 1
    })

    // Resize
    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    window.changeColor = (color) => {
      if (!modelRef) return

      modelRef.traverse((child) => {
        if (child.isMesh) {
          child.material.color.set(color)
        }
      })
    }

    window.selectShoe = (type) => {
      if (type === 'nike' && nikeModel) {
        modelRef = nikeModel
        focusOn(nikeModel)
      }
    }

    function animate() {
      requestAnimationFrame(animate)
      controls.update()
      if (modelRef) {
        // Auto rotate
        modelRef.rotation.y += 0.0015

        // Hover tilt (smooth)
        modelRef.rotation.x += (mouseY * 0.3 - modelRef.rotation.x) * 0.05
        modelRef.rotation.z += (mouseX * 0.2 - modelRef.rotation.z) * 0.05
      }
      renderer.render(scene, camera)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('click', onClick)
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <>
      <div id="canvas-container"></div>

      <div id="loader">Loading...</div>

      <div id="overlay">
        <h1 className="title">Nike Air 720</h1>
        <p className="subtitle">Ultra comfort. Premium design.</p>
        <div className="price">$199</div>
        <button 
          className="cta"
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          Buy Now
        </button>
      </div>
      <div id="controls">
        <button onClick={() => window.changeColor('#ffffff')}>White</button>
        <button onClick={() => window.changeColor('#000000')}>Black</button>
        <button onClick={() => window.changeColor('#ff0000')}>Red</button>
        <button onClick={() => window.selectShoe('nike')}>Nike</button>
      </div>

      <div id="sections">
        <section className="section">Premium Design</section>
        <section className="section">Comfort & Fit</section>
        <section className="section">Performance</section>
      </div>
    </>
  )
}

export default App