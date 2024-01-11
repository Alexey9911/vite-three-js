import * as T from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';
import fragmentSimulation from '../shaders/fragmentSimulation.glsl';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

const WIDTH = 32;

export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new T.Scene();
    this.scene.background = new T.Color('#002');

    this.camera = new T.PerspectiveCamera(
      75,
      device.width / device.height,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 2);
    this.scene.add(this.camera);

    this.renderer = new T.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });

    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.canvas);

    this.clock = new T.Clock();
    this.initGPGPU();
    this.setLights();
    this.setGeometry();
    this.render();
  }

  initGPGPU() {
    this.gpgpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, this.renderer);
    this.dtPosition = this.gpgpuCompute.createTexture();
    
    
    this.positionVariable = this.gpgpuCompute.addVariable(
      'texturePosition',
      fragmentSimulation,
      this.dtPosition
      );
      this.positionVariable.material.uniforms['time'] = { value: 0 };
      
      this.positionVariable.wrapS = T.RepeatWrapping;
      this.positionVariable.wrapT = T.RepeatWrapping;
      this.fillPositions(this.dtPosition);
      
      
      this.gpgpuCompute.init();
      console.log(this.positionVariable);
  }

    

  fillPositions(texture) {
    this.bb = 200;
    for (let i = 0; i < 1024; i++) {
      let i3 = i * 4;
      let x = Math.random();
      let y = Math.random();
      let z = Math.random();

      this.dtPosition.image.data[i3 + 0] = x;
      this.dtPosition.image.data[i3 + 1] = y;
      this.dtPosition.image.data[i3 + 2] = z;
      this.dtPosition.image.data[i3 + 3] = 1;
    }
  }

  setLights() {
    this.ambientLight = new T.AmbientLight(new T.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);
  }

  setGeometry() {
    this.planeGeometry = new T.BufferGeometry();
    this.planeMaterial = new T.ShaderMaterial({
      fragmentShader: fragment,
      vertexShader: vertex,
      uniforms: {
        progress: { type: 'f', value: 0 },
        positionTexture: {value: null }
      }
    });

    const array = new Float32Array(WIDTH * WIDTH * 3);
    const reference = new Float32Array(WIDTH * WIDTH * 2);

    for (let i = 0; i < WIDTH * WIDTH; i++) {
      array[i * 3 + 0] = Math.random();
      array[i * 3 + 1] = Math.random();
      array[i * 3 + 2] = Math.random();

      reference[i * 2 + 0] = (i % WIDTH) / WIDTH;
      reference[i * 2 + 1] = ~~(i / WIDTH) / WIDTH;
    }

    this.planeGeometry.setAttribute(
      'position',
      new T.BufferAttribute(array, 3)
    );
    this.planeGeometry.setAttribute(
      'reference',
      new T.BufferAttribute(reference, 2)
    );

    this.planeMesh = new T.Points(this.planeGeometry, this.planeMaterial);
    this.scene.add(this.planeMesh);
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();

    this.gpgpuCompute.compute();

    this.planeMaterial.uniforms.positionTexture.value =
      this.gpgpuCompute.getCurrentRenderTarget(this.positionVariable).texture;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  setResize() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    device.width = window.innerWidth;
    device.height = window.innerHeight;

    this.camera.aspect = device.width / device.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
  }
}
