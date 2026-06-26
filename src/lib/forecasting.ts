// src/lib/forecasting.ts

export async function trainAndPredictForecast(moodLogs: any[]) {
  // Dynamically load tfjs to avoid blocking main thread at startup
  const tf = await import('@tensorflow/tfjs');

  // Sort chronologically
  const sorted = moodLogs.sort((a, b) => a.timestamp - b.timestamp);
  
  if (sorted.length < 5) return null; // Not enough history
  
  // Prepare sequential sequences (sliding window of size 3)
  const windowSize = 3;
  const X = [];
  const Y = [];
  
  for (let i = 0; i < sorted.length - windowSize; i++) {
    const seq = [];
    for (let j = 0; j < windowSize; j++) {
      const log = sorted[i + j].data;
      const date = new Date(sorted[i + j].timestamp);
      seq.push([
        log.valence || 0,
        log.arousal || 0,
        date.getHours() / 24, // Normalize hour
        date.getDay() / 7     // Normalize day
      ]);
    }
    const targetLog = sorted[i + windowSize].data;
    // We predict if the next event is High Arousal, Negative Valence (Anxiety/Stress)
    const isStressed = (targetLog.valence < -0.2 && targetLog.arousal > 0.2) ? 1 : 0;
    
    X.push(seq);
    Y.push([isStressed]);
  }
  
  if (X.length === 0) return null;

  const xs = tf.tensor3d(X);
  const ys = tf.tensor2d(Y);
  
  // Build a lightweight LSTM model
  const model = tf.sequential();
  model.add(tf.layers.lstm({ units: 8, inputShape: [windowSize, 4], returnSequences: false }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  
  model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });
  
  // Train completely on-device
  await model.fit(xs, ys, { epochs: 15, verbose: 0 });
  
  // Predict next state based on the most recent window
  const lastSeq = [];
  for (let j = sorted.length - windowSize; j < sorted.length; j++) {
      const log = sorted[j].data;
      const date = new Date(sorted[j].timestamp);
      lastSeq.push([
        log.valence || 0,
        log.arousal || 0,
        date.getHours() / 24,
        date.getDay() / 7
      ]);
  }
  
  const input = tf.tensor3d([lastSeq]);
  const prediction = model.predict(input) as any;
  const prob = (await prediction.data())[0];
  
  // Clean up VRAM
  tf.dispose([xs, ys, input, prediction]);
  
  return prob; // Returns 0.0 to 1.0 probability of a stress event
}
