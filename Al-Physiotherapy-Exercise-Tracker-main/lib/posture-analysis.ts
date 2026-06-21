interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const magBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);
  if (magBA === 0 || magBC === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.acos(cos) * (180 / Math.PI);
}

export function calculateDistance(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function getVerticalAngle(a: Landmark, b: Landmark): number {
  return Math.abs(Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI));
}

export function analyzeSquat(landmarks: Landmark[]) {
  const leftHipAngle = calculateAngle(landmarks[11], landmarks[23], landmarks[25]);
  const rightHipAngle = calculateAngle(landmarks[12], landmarks[24], landmarks[26]);
  const leftKneeAngle = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
  const rightKneeAngle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
  const leftAnkleAngle = calculateAngle(landmarks[25], landmarks[27], landmarks[29]);
  const rightAnkleAngle = calculateAngle(landmarks[26], landmarks[28], landmarks[30]);
  const backInclination = calculateAngle(landmarks[11], landmarks[23], landmarks[25]);
  const kneeAlignment = Math.abs(landmarks[25].x - landmarks[27].x) - Math.abs(landmarks[26].x - landmarks[28].x);

  const feedback: string[] = [];
  let accuracy = 100;

  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
  const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

  if (avgKneeAngle > 110) {
    feedback.push('Lower your hips further - not deep enough');
    accuracy -= 10;
  }
  if (avgKneeAngle < 60) {
    feedback.push('Do not go too low - maintain safe range');
    accuracy -= 5;
  }
  if (kneeAlignment > 0.05) {
    feedback.push('Keep your knees aligned over your ankles');
    accuracy -= 15;
  }
  if (backInclination < 70 || backInclination > 110) {
    feedback.push('Keep your back straight and chest up');
    accuracy -= 15;
  }
  if (Math.abs(leftHipAngle - rightHipAngle) > 10) {
    feedback.push('Maintain symmetry - both sides should move equally');
    accuracy -= 10;
  }

  return {
    angles: { leftHipAngle, rightHipAngle, leftKneeAngle, rightKneeAngle, leftAnkleAngle, rightAnkleAngle, backInclination },
    feedback: feedback.length > 0 ? feedback : ['Good form!'],
    accuracy: Math.max(0, Math.round(accuracy)),
    isCorrect: feedback.length === 0,
  };
}

export function analyzeArmRaise(landmarks: Landmark[]) {
  const leftShoulderAngle = calculateAngle(landmarks[23], landmarks[11], landmarks[13]);
  const rightShoulderAngle = calculateAngle(landmarks[24], landmarks[12], landmarks[14]);
  const leftElbowAngle = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
  const rightElbowAngle = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
  const leftWristHeight = 1 - landmarks[15].y;
  const rightWristHeight = 1 - landmarks[16].y;

  const feedback: string[] = [];
  let accuracy = 100;

  const avgShoulderAngle = (leftShoulderAngle + rightShoulderAngle) / 2;
  const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

  if (avgShoulderAngle < 160) {
    feedback.push('Raise your arms higher to shoulder level');
    accuracy -= 15;
  }
  if (avgElbowAngle < 160) {
    feedback.push('Keep your arms straight - do not bend elbows');
    accuracy -= 10;
  }
  if (Math.abs(leftShoulderAngle - rightShoulderAngle) > 10) {
    feedback.push('Raise both arms equally');
    accuracy -= 10;
  }
  if (leftWristHeight < 0.3 || rightWristHeight < 0.3) {
    feedback.push('Lift your arms higher');
    accuracy -= 10;
  }

  return {
    angles: { leftShoulderAngle, rightShoulderAngle, leftElbowAngle, rightElbowAngle },
    feedback: feedback.length > 0 ? feedback : ['Good form!'],
    accuracy: Math.max(0, Math.round(accuracy)),
    isCorrect: feedback.length === 0,
  };
}

export function analyzeLunge(landmarks: Landmark[]) {
  const leftKneeAngle = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
  const rightKneeAngle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
  const leftHipAngle = calculateAngle(landmarks[11], landmarks[23], landmarks[25]);
  const rightHipAngle = calculateAngle(landmarks[12], landmarks[24], landmarks[26]);
  const backInclination = Math.abs(getVerticalAngle(landmarks[11], landmarks[23]) - 90);
  const frontKneeX = landmarks[25].x;
  const frontAnkleX = landmarks[27].x;
  const kneeOverToes = Math.abs(frontKneeX - frontAnkleX);

  const feedback: string[] = [];
  let accuracy = 100;

  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
  const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

  if (avgKneeAngle > 100) {
    feedback.push('Lower your body more - knee angle should be ~90 degrees');
    accuracy -= 10;
  }
  if (kneeOverToes > 0.08) {
    feedback.push('Keep your knee aligned over your ankle - do not let it go past your toes');
    accuracy -= 15;
  }
  if (backInclination > 15) {
    feedback.push('Keep your torso upright - do not lean forward');
    accuracy -= 15;
  }
  if (Math.abs(leftHipAngle - rightHipAngle) > 20) {
    feedback.push('Maintain balance - distribute weight evenly');
    accuracy -= 10;
  }

  return {
    angles: { leftKneeAngle, rightKneeAngle, leftHipAngle, rightHipAngle, backInclination },
    feedback: feedback.length > 0 ? feedback : ['Good form!'],
    accuracy: Math.max(0, Math.round(accuracy)),
    isCorrect: feedback.length === 0,
  };
}

export function analyzeKneeExtension(landmarks: Landmark[]) {
  const leftKneeAngle = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
  const rightKneeAngle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);

  const feedback: string[] = [];
  let accuracy = 100;

  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  if (avgKneeAngle > 170) {
    feedback.push('Do not hyperextend your knee - keep a slight bend');
    accuracy -= 10;
  }
  if (avgKneeAngle < 80) {
    feedback.push('Extend your leg more - not enough range');
    accuracy -= 10;
  }

  return {
    angles: { leftKneeAngle, rightKneeAngle },
    feedback: feedback.length > 0 ? feedback : ['Good form!'],
    accuracy: Math.max(0, Math.round(accuracy)),
    isCorrect: feedback.length === 0,
  };
}

export function analyzeHeelSlide(landmarks: Landmark[]) {
  const leftHeelY = landmarks[27].y;
  const rightHeelY = landmarks[28].y;
  const leftHipY = landmarks[23].y;
  const rightHipY = landmarks[24].y;

  const feedback: string[] = [];
  let accuracy = 100;

  const leftSlideDistance = Math.abs(leftHipY - leftHeelY);
  const rightSlideDistance = Math.abs(rightHipY - rightHeelY);

  if (leftSlideDistance < 0.1 && rightSlideDistance < 0.1) {
    feedback.push('Slide your heel closer to your buttocks');
    accuracy -= 15;
  }
  if (Math.abs(leftSlideDistance - rightSlideDistance) > 0.05) {
    feedback.push('Slide both heels equally');
    accuracy -= 10;
  }

  return {
    feedback: feedback.length > 0 ? feedback : ['Good form!'],
    accuracy: Math.max(0, Math.round(accuracy)),
    isCorrect: feedback.length === 0,
  };
}

export function analyzeShoulderRotation(landmarks: Landmark[]) {
  const leftShoulderAngle = calculateAngle(landmarks[23], landmarks[11], landmarks[13]);
  const rightShoulderAngle = calculateAngle(landmarks[24], landmarks[12], landmarks[14]);

  const feedback: string[] = [];
  let accuracy = 100;

  if (leftShoulderAngle < 30 || rightShoulderAngle < 30) {
    feedback.push('Rotate your arms further outward');
    accuracy -= 10;
  }
  if (Math.abs(leftShoulderAngle - rightShoulderAngle) > 10) {
    feedback.push('Rotate both arms equally');
    accuracy -= 10;
  }

  return {
    angles: { leftShoulderAngle, rightShoulderAngle },
    feedback: feedback.length > 0 ? feedback : ['Good form!'],
    accuracy: Math.max(0, Math.round(accuracy)),
    isCorrect: feedback.length === 0,
  };
}

export function analyzeLegRaise(landmarks: Landmark[]) {
  const leftHipAngle = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
  const rightHipAngle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
  const leftLegAngle = calculateAngle(landmarks[11], landmarks[23], landmarks[25]);
  const rightLegAngle = calculateAngle(landmarks[12], landmarks[24], landmarks[26]);

  const feedback: string[] = [];
  let accuracy = 100;

  const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

  if (avgHipAngle < 70) {
    feedback.push('Raise your legs higher');
    accuracy -= 10;
  }
  if (Math.abs(leftLegAngle - rightLegAngle) > 10) {
    feedback.push('Raise both legs equally');
    accuracy -= 10;
  }

  return {
    angles: { leftHipAngle, rightHipAngle, leftLegAngle, rightLegAngle },
    feedback: feedback.length > 0 ? feedback : ['Good form!'],
    accuracy: Math.max(0, Math.round(accuracy)),
    isCorrect: feedback.length === 0,
  };
}

export function analyzeGluteBridge(landmarks: Landmark[]) {
  const leftHipAngle = calculateAngle(landmarks[11], landmarks[23], landmarks[25]);
  const rightHipAngle = calculateAngle(landmarks[12], landmarks[24], landmarks[26]);
  const backAngle = calculateAngle(landmarks[11], landmarks[23], landmarks[24]);

  const feedback: string[] = [];
  let accuracy = 100;

  const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

  if (avgHipAngle > 160) {
    feedback.push('Lift your hips higher');
    accuracy -= 15;
  }
  if (backAngle < 160) {
    feedback.push('Keep your back straight - do not arch');
    accuracy -= 15;
  }

  return {
    angles: { leftHipAngle, rightHipAngle, backAngle },
    feedback: feedback.length > 0 ? feedback : ['Good form!'],
    accuracy: Math.max(0, Math.round(accuracy)),
    isCorrect: feedback.length === 0,
  };
}

export function analyzeWallPushup(landmarks: Landmark[]) {
  const leftElbowAngle = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
  const rightElbowAngle = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
  const bodyAngle = calculateAngle(landmarks[23], landmarks[11], landmarks[15]);

  const feedback: string[] = [];
  let accuracy = 100;

  const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

  if (avgElbowAngle > 110) {
    feedback.push('Lower your body closer to the wall');
    accuracy -= 10;
  }
  if (bodyAngle < 140) {
    feedback.push('Keep your body straight - do not sag hips');
    accuracy -= 15;
  }

  return {
    angles: { leftElbowAngle, rightElbowAngle, bodyAngle },
    feedback: feedback.length > 0 ? feedback : ['Good form!'],
    accuracy: Math.max(0, Math.round(accuracy)),
    isCorrect: feedback.length === 0,
  };
}

export function analyzeAnklePumps(landmarks: Landmark[]) {
  const leftAnkleAngle = calculateAngle(landmarks[25], landmarks[27], landmarks[29]);
  const rightAnkleAngle = calculateAngle(landmarks[26], landmarks[28], landmarks[30]);

  const feedback: string[] = [];
  let accuracy = 100;

  const avgAnkleAngle = (leftAnkleAngle + rightAnkleAngle) / 2;

  if (avgAnkleAngle < 10 || avgAnkleAngle > 170) {
    feedback.push('Move your ankle through full range of motion');
    accuracy -= 10;
  }

  return {
    angles: { leftAnkleAngle, rightAnkleAngle },
    feedback: feedback.length > 0 ? feedback : ['Good form!'],
    accuracy: Math.max(0, Math.round(accuracy)),
    isCorrect: feedback.length === 0,
  };
}

export function analyzePosture(landmarks: Landmark[]) {
  const feedback: string[] = [];
  let accuracy = 100;

  const shoulderAngle = calculateAngle(landmarks[11], landmarks[12], landmarks[24]);
  const neckAlignment = calculateAngle(landmarks[0], landmarks[11], landmarks[12]);
  const backAlignment = calculateAngle(landmarks[11], landmarks[23], landmarks[24]);

  if (shoulderAngle < 80) {
    feedback.push('Roll your shoulders back');
    accuracy -= 15;
  }
  if (neckAlignment < 160) {
    feedback.push('Keep your neck straight - do not tilt forward');
    accuracy -= 15;
  }
  if (backAlignment < 160) {
    feedback.push('Keep your back straight and aligned');
    accuracy -= 15;
  }

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (Math.abs(leftShoulder.y - rightShoulder.y) > 0.05) {
    feedback.push('Keep shoulders level');
    accuracy -= 10;
  }
  if (Math.abs(leftHip.y - rightHip.y) > 0.05) {
    feedback.push('Keep hips level');
    accuracy -= 10;
  }

  return {
    angles: { shoulderAngle, neckAlignment, backAlignment },
    feedback: feedback.length > 0 ? feedback : ['Good posture!'],
    accuracy: Math.max(0, Math.round(accuracy)),
    isCorrect: feedback.length === 0,
  };
}
