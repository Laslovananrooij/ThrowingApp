function interpolate(x, xp, fp) {
    if (x <= xp[0]) return fp[0];
    if (x >= xp[xp.length - 1]) return fp[fp.length - 1];
  
    for (let i = 0; i < xp.length - 1; i++) {
      if (x >= xp[i] && x <= xp[i + 1]) {
        const x0 = xp[i], x1 = xp[i + 1];
        const y0 = fp[i], y1 = fp[i + 1];
        return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
      }
    }
  
    return 0; // fallback
  }
  

export class Disc {
    constructor(name) {
      this.name = name;
      this.cl = [0];
      this.cd = [0];
      this.cm = [0];
      this.aoarange = [0]; // You should set this to match the data range of cl/cd/cm
      this.jxy = 0;
      this.jz = 0;
      this.diam = 0;
    }
  
    getCl(aoa) {
      return interpolate(aoa, this.aoarange, this.cl);
    }
  
    getCd(aoa) {
      return interpolate(aoa, this.aoarange, this.cd);
    }
  
    getCm(aoa) {
      return interpolate(aoa, this.aoarange, this.cm);
    }
  }
  
  export class Throw {
    constructor(name) {
        this.name = name;
        this.cl = [0];
        this.cd = [0];
        this.cm = [0];
        this.pos_g = []; // Should be filled with [x, y, z] arrays over time
    }
  
    getDistance() {
        if (this.pos_g.length === 0) return 0;
  
        const last = this.pos_g[this.pos_g.length - 1];
        return Math.sqrt(last[0] ** 2 + last[1] ** 2);
    }
  }
  
  export function huckit(disc, throwObj) {
  const dt = 0.01;
  const maxSteps = 2000;
  let step = 0;
  
  const scalarArraySize = maxSteps + 1;
  const vectorArraySize = Array(maxSteps + 1).fill([0, 0, 0]);
  
  throwObj.launch_angle = (throwObj.launch_angle/180)*Math.PI
  throwObj.nose_angle   = (throwObj.nose_angle/180)*Math.PI
  throwObj.roll_angle   = (throwObj.roll_angle/180)*Math.PI

  const t = new Array(scalarArraySize).fill(0);
  var pos_g = Array(maxSteps + 1).fill([0, 0, 0]);
  var vel_g = Array(maxSteps + 1).fill([0, 0, 0]);
  var acl_g = Array(maxSteps + 1).fill([0, 0, 0]);
  var ori_g = Array(maxSteps + 1).fill([0, 0, 0]);
  var rot_g = Array(maxSteps + 1).fill([0, 0, 0]);
  var acl_d = Array(maxSteps + 1).fill([0, 0, 0]);
  var vel_d = Array(maxSteps + 1).fill([0, 0, 0]);
  var rot_d = Array(maxSteps + 1).fill([0, 0, 0]);
  var acl_s = Array(maxSteps + 1).fill([0, 0, 0]);
  var vel_s = Array(maxSteps + 1).fill([0, 0, 0]);
  var rot_s = Array(maxSteps + 1).fill([0, 0, 0]);
  var acl_w = Array(maxSteps + 1).fill([0, 0, 0]);
  var vel_w = Array(maxSteps + 1).fill([0, 0, 0]);

  var beta = new Array(scalarArraySize).fill(0);
  var alpha = new Array(scalarArraySize).fill(0);
  var drag = new Array(scalarArraySize).fill(0);
  var lift = new Array(scalarArraySize).fill(0);
  var mom = new Array(scalarArraySize).fill(0);
  
  ori_g[step] = [throwObj.roll_angle, throwObj.nose_angle, 0];
  vel_g[step] = [
    throwObj.speed * Math.cos(throwObj.launch_angle),
    0,
    throwObj.speed * Math.sin(throwObj.launch_angle),
  ];

  const launch_angle_d = math.multiply(T_gd(ori_g[step]), [0, throwObj.launch_angle, 0])
  ori_g[step] = ori_g[step].map((val, i) => val + launch_angle_d[i]);
  
  const rho = 1.18;
  const g = 9.81;
  throwObj.launch_height = 1.5;
  pos_g[step] = [0, 0, throwObj.launch_height];
  
  const mass = disc.mass;
  const diam = disc.diam;
  const ixy = disc.jxy * mass;
  const iz = disc.jz * mass;
  const area = Math.PI * ((1/2)*diam)**2;
  const omega0 = throwObj.spin * throwObj.spindir;
  const I_z = 1.4e-3; // Moment of inertia around spin axis in kg·m²
  const C_Nr = 2e-5; // Spin damping coefficient in N·m·s (approximate)

  const weight = g * mass;
  let omega = omega0
  while (pos_g[step][2] > 0 && step < maxSteps) {
    let ii = 0;
    if (step >= maxSteps){
      break
    }
    while (ii < 2) {
      vel_d[step] = math.multiply(T_gd(ori_g[step]), vel_g[step]);
      beta[step] = -Math.atan2(vel_d[step][1], vel_d[step][0]);
      vel_s[step] = math.multiply(T_ds(beta[step]), vel_d[step]);
      alpha[step] = -Math.atan2(vel_s[step][2], vel_s[step][0]);
      vel_w[step] = math.multiply(T_sw(alpha[step]), vel_s[step]);
      

      const grav_d = math.multiply(T_gd(ori_g[step]), [0, 0, -weight]);
      const grav_s = math.multiply(T_ds(beta[step]), grav_d);
      const grav_w = math.multiply(T_sw(alpha[step]), grav_s);
      
      const v2 = vel_w[step].reduce((sum, x) => sum + x**2, 0);
      drag[step] = 0.5 * rho * v2 * area * disc.getCd(alpha[step]);
      lift[step] = 0.5 * rho * v2 * area * disc.getCl(alpha[step]);
      mom[step]  = 0.5 * rho * v2 * area * (diam/2) * disc.getCm(alpha[step]);
      acl_w[step][0] = (-drag[step] + grav_w[0]) / mass;
      acl_w[step][2] = (lift[step] + grav_w[2]) / mass;
      acl_w[step][1] = grav_w[1] / mass;
      rot_s[step][0] = -mom[step] / (omega * (ixy - iz));
      // Added spin rate decay over time (fast at first decaying over time)
      const domega_dt = -C_Nr / I_z * omega;
      omega += domega_dt * dt;
      acl_s[step] = math.multiply(T_ws(alpha[step]), acl_w[step]);
      acl_d[step] = math.multiply(T_sd(beta[step]), acl_s[step]);
      acl_g[step] = math.multiply(T_dg(ori_g[step]), acl_d[step]);
  
      rot_d[step] = math.multiply(T_sd(beta[step]), rot_s[step]);
      rot_g[step] = math.multiply(T_dg(ori_g[step]), rot_d[step]);
  
      if (step == 0 ) 
        {break;}
  
      if (ii >= 1) {break}
      const avg_acl_g = acl_g[step - 1].map((val, i) => (val + acl_g[step][i]) / 2);
      const avg_rot_g = rot_g[step - 1].map((val, i) => (val + rot_g[step][i]) / 2);

      vel_g[step] = vel_g[step - 1].map((val, i) => val + avg_acl_g[i] * dt);
      pos_g[step] = pos_g[step - 1].map(
        (val, i) => val + vel_g[step - 1][i] * dt + 0.5 * avg_acl_g[i] * dt ** 2
      );
      ori_g[step] = ori_g[step - 1].map((val, i) => val + avg_rot_g[i] * dt);
      
  
      ii++;
    }
  
    vel_g[step + 1] = vel_g[step].map((v, i) => v + acl_g[step][i] * dt);
    pos_g[step + 1] = pos_g[step].map(
      (p, i) => p + vel_g[step][i] * dt + 0.5 * acl_g[step][i] * dt ** 2
    );
    ori_g[step + 1] = ori_g[step].map((o, i) => o + rot_g[step][i] * dt);

    t[step + 1] = t[step] + dt;
    step++;

  }
  // Assign final simulation data to the throw object
  throwObj.t = t.slice(0, step);
  throwObj.lift = lift.slice(0, step);
  throwObj.drag = drag.slice(0, step);
  throwObj.mom = mom.slice(0, step);
  throwObj.alpha = alpha.slice(0, step);
  throwObj.beta = beta.slice(0, step);
  throwObj.pos_g = pos_g.slice(0, step);
  throwObj.vel_g = vel_g.slice(0, step);
  throwObj.acl_g = acl_g.slice(0, step);
  throwObj.ori_g = ori_g.slice(0, step);
  throwObj.rot_g = rot_g.slice(0, step);
  throwObj.vel_d = vel_d.slice(0, step);
  throwObj.vel_w = vel_w.slice(0, step);
  throwObj.acl_w = acl_w.slice(0, step);
  throwObj.rot_s = rot_s.slice(0, step);
  
  return throwObj;
  }

// Matrix utility helpers
function cos(x) { return Math.cos(x); }
function sin(x) { return Math.sin(x); }

// Ground to Disc



export function T_gd([phi, theta, psi]) {
  return [
    [cos(theta) * cos(psi), sin(phi) * sin(theta) * cos(psi) - cos(phi) * sin(psi), cos(phi) * sin(theta) * cos(psi) + sin(phi) * sin(psi)],
    [cos(theta) * sin(psi), sin(phi) * sin(theta) * sin(psi) + cos(phi) * cos(psi), cos(phi) * sin(theta) * sin(psi) - sin(phi) * cos(psi)],
    [-sin(theta),           sin(phi) * cos(theta),                                    cos(phi) * cos(theta)]
  ];
}

// Disc to Ground
function T_dg([phi, theta, psi]) {
  return [
    [cos(theta) * cos(psi), cos(theta) * sin(psi), -sin(theta)],
    [sin(phi) * sin(theta) * cos(psi) - cos(phi) * sin(psi), sin(phi) * sin(theta) * sin(psi) + cos(phi) * cos(psi), sin(phi) * cos(theta)],
    [cos(phi) * sin(theta) * cos(psi) + sin(phi) * sin(psi), cos(phi) * sin(theta) * sin(psi) - sin(phi) * cos(psi), cos(phi) * cos(theta)]
  ];
}

// Disc to Slip
function T_ds(beta) {
  return [
    [cos(beta), -sin(beta), 0],
    [sin(beta),  cos(beta), 0],
    [0,          0,         1]
  ];
}

// Slip to Disc
function T_sd(beta) {
  return [
    [cos(beta),  sin(beta), 0],
    [-sin(beta), cos(beta), 0],
    [0,          0,         1]
  ];
}

// Slip to Wind
function T_sw(alpha) {
  return [
    [cos(alpha), 0, -sin(alpha)],
    [0,          1, 0],
    [sin(alpha), 0, cos(alpha)]
  ];
}

// Wind to Slip
function T_ws(alpha) {
  return [
    [cos(alpha), 0, sin(alpha)],
    [0,          1, 0],
    [-sin(alpha), 0, cos(alpha)]
  ];
}