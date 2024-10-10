function matrix_mul3(ma, mb){ // ,ma, mb is row major
  mc = new Array(9).fill(0);
  for(i = 0; i < 3; i ++){
    for(j = 0; j < 3; j ++){
      for(k = 0; k < 3; k ++){
        idx_c = i * 3 + j; // col major
        idx_a = i * 3 + k;
        idx_b = k * 3 + j;
        mc[idx_c] += ma[idx_a] * mb[idx_b];
      }
    }
  }
  return mc;
}

function matrix_vector_mul3(ma, mb){ // ,ma, mb is row major
  mc = new Array(3).fill(0);
  for(i = 0; i < 3; i ++){
    for(j = 0; j < 3; j ++){
        idx_c = i; // col major
        idx_a = i * 3 + j;
        idx_b = j;
        mc[idx_c] += ma[idx_a] * mb[idx_b];
    }
  }
  return mc;
}

function transpose3(m){
  mt = new Array(9);
  for(i = 0; i < 3; i ++){
    for(j = 0; j < 3; j ++){
      idx_t = j * 3 + i;
      idx_m = i * 3 + j;
      mt[idx_t] = m[idx_m];
    }
  }
  return mt;
}

function inverse(m) {
  let [
    a11, a12, a13,     
    a21, a22, a23, 
    a31, a32, a33
  ] = m;
  det = a11 * (a22 * a33 - a23 * a32) -
        a12 * (a21 * a33 - a23 * a31) +
        a13 * (a21 * a32 - a22 * a31);
  if (det === 0)
      throw new Error("Singular matrix!");
  inv_det = 1 / det;
  inv_m = [
    inv_det * (a22 * a33 - a23 * a32), inv_det * (a13 * a32 - a12 * a33), inv_det * (a12 * a23 - a13 * a22),
    inv_det * (a23 * a31 - a21 * a33), inv_det * (a11 * a33 - a13 * a31), inv_det * (a13 * a21 - a11 * a23),
    inv_det * (a21 * a32 - a22 * a31), inv_det * (a12 * a31 - a11 * a32), inv_det * (a11 * a22 - a12 * a21)
  ];
  return inv_m;
}

function to_radian(degree){
  return degree / 180. * Math.PI;
}

class Transform2 {
  constructor(t=[0, 0], s=[1, 1], d=0){
    this.t = t
    this.s = s
    this.d = d;
    this.mat = null // row major
    this.inv_mat = null // row major
  }

  translate(tx, ty){
    this.t[0] += tx
    this.t[1] += ty
    this.mat = null
    this.inv_mat = null
  }

  rotate(d){
    this.d += d;
    this.mat = null
    this.inv_mat = null  
  }

  scale(sx, sy){
    this.s[0] *= sx;
    this.s[1] *= sy;
    this.mat = null
    this.inv_mat = null 
  }

  calculate(){
    let theta = to_radian(this.d)
    this.mat = matrix_mul3(
      [1, 0, this.t[0], 0, 1, this.t[1], 0, 0, 1],
        matrix_mul3(
          [this.s[0], 0, 0, 0, this.s[1], 0, 0, 0, 1],
          [
            Math.cos(theta), -Math.sin(theta), 0,
            Math.sin(theta), Math.cos(theta), 0,
            0, 0, 1
          ]
        )
    )
    this.inv_mat = inverse(this.mat)
  }

  matrix(transpose=false){ 
    if(this.mat == null)
      this.calculate();
    if(transpose)
      return transpose3(this.mat)
    return this.mat;
  }

  inv_matrix(transpose=false){ 
    if(this.inv_mat == null)
      this.calculate();
    if(transpose)
      return transpose3(this.inv_mat)
    return this.inv_mat;
  }

  clone(){
    let t = [this.t[0], this.t[1]]
    let s = [this.s[0], this.s[1]]
    let d = this.d
    return new Transform2(t, s, d);
  }
}

class Projection2{
  constructor(width, height){
    this.width = width;
    this.height = height;
    this.mat = null; // row major
    this.inv_mat = null; // row major
  }
  set_width(w){
    this.width = w;
    this.mat = null;
    this.inv_mat = null;
  }
  set_height(h){
    this.height = h;
    this.mat = null;
    this.inv_mat = null;
  }
  calculate(){
    this.aspect_ratio = this.width * 1.0 / this.height
    this.mat = [
      1 / this.aspect_ratio, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]
    this.inv_mat = inverse(this.mat)
  }
  matrix(transpose=false){
    if(this.mat == null)
      this.calculate();
    if(transpose)
      return transpose3(this.mat)
    return this.mat
  }
  inv_matrix(transpose=false){
    if(this.inv_mat == null)
      this.calculate();
    if(transpose)
      return transpose3(this.inv_mat)
    return this.inv_mat
  }
}