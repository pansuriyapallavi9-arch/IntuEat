import React, { useState, useEffect, useContext, useRef, useId } from 'react';
import { motion } from 'framer-motion';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { RefreshCw, Upload, CheckCircle } from 'lucide-react';
import { UserContext } from '../../context/UserContext';

export default function BarcodeScanner() {
  const readerId = useId().replace(/:/g, '');
  const [scanResult, setScanResult] = useState('');
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weight, setWeight] = useState(100);
  const [manualCode, setManualCode] = useState('');
  const [autoSaved, setAutoSaved] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [savingBarcodeMeal, setSavingBarcodeMeal] = useState(false);
  const { addMealToHistory } = useContext(UserContext);
  const scannerRef = useRef(null);
  const scannerInitializingRef = useRef(false);

  const resetReaderContainer = () => {
    const readerElement = document.getElementById(readerId);
    if (readerElement) {
      readerElement.innerHTML = '';
    }
  };

  const destroyScanner = async () => {
    const activeScanner = scannerRef.current;
    scannerRef.current = null;
    scannerInitializingRef.current = false;
    setCameraReady(false);

    if (activeScanner) {
      try {
        const state = activeScanner.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await activeScanner.stop();
        }
      } catch (err) {
        console.error('Stop error', err);
      }

      try {
        await activeScanner.clear();
      } catch (err) {
        console.error('Clear error', err);
      }
    }

    resetReaderContainer();
  };

  const getPreferredCameraId = async () => {
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras?.length) {
      throw new Error('No cameras found');
    }

    const preferredCamera =
      cameras.find((camera) => /back|rear|environment/i.test(camera.label)) ||
      cameras[cameras.length - 1] ||
      cameras[0];

    return preferredCamera.id;
  };

  useEffect(() => {
    let isCancelled = false;

    const mountScanner = async () => {
      if (scanResult || !cameraActive || scannerRef.current || scannerInitializingRef.current) {
        return;
      }

      scannerInitializingRef.current = true;
      resetReaderContainer();
      setError('');

      try {
        const html5QrCode = new Html5Qrcode(readerId);
        const cameraId = await getPreferredCameraId();

        if (isCancelled) {
          scannerInitializingRef.current = false;
          return;
        }

        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          cameraId,
          {
            fps: 12,
            qrbox: { width: 250, height: 160 },
            aspectRatio: 1.777778,
            disableFlip: false,
          },
          async (decodedText) => {
            setScanResult(decodedText);
            await destroyScanner();
          },
          () => {}
        );

        if (isCancelled) {
          await destroyScanner();
          scannerInitializingRef.current = false;
          return;
        }

        scannerInitializingRef.current = false;
        setCameraReady(true);
      } catch (err) {
        scannerInitializingRef.current = false;
        console.error('Scanner init error:', err);
        setCameraReady(false);
        resetReaderContainer();
      }
    };

    if (!scanResult && cameraActive) {
      mountScanner();
    }

    return () => {
      isCancelled = true;
      destroyScanner();
    };
  }, [readerId, scanResult, cameraActive]);

  useEffect(() => {
    if (scanResult) {
      fetchProductDetails(scanResult);
    }
  }, [scanResult]);

  const fetchProductDetails = async (barcode) => {
    setLoading(true);
    setError('');
    setAutoSaved(false);

    try {
      const response = await fetch('/api/agent/barcode-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode }),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Gemini could not resolve this barcode.');
      }

      setProductData(data);
      setSavingBarcodeMeal(true);
      await addMealToHistory({
        date: new Date().toLocaleDateString() + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'snack',
        name: data.product_name || `Barcode ${barcode}`,
        cals: Math.round(data.nutriments?.['energy-kcal_100g'] || 0),
        protein: parseFloat((data.nutriments?.proteins_100g || 0).toFixed(1)),
        carbs: parseFloat((data.nutriments?.carbohydrates_100g || 0).toFixed(1)),
        fat: parseFloat((data.nutriments?.fat_100g || 0).toFixed(1)),
        score: data.nutriscore_grade === 'a' ? 9 : data.nutriscore_grade === 'b' ? 7 : data.nutriscore_grade === 'c' ? 6 : data.nutriscore_grade ? 5 : 'N/A',
        source: 'barcode',
        barcode: data.barcode || barcode,
        brand: data.brands || '',
        servingSize: data.serving_size || '',
        scanRecordId: data.savedScanId || '',
        description: data.description || '',
        allergens: Array.isArray(data.allergens) ? data.allergens : [],
      });
      setAutoSaved(true);
    } catch (err) {
      console.error('Barcode Gemini lookup error:', err);
      setError('Unable to find product details from Gemini. Please try again or enter the barcode manually.');
    } finally {
      setSavingBarcodeMeal(false);
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    
    try {
      await destroyScanner();
      const html5QrCode = new Html5Qrcode(readerId);
      const decodedText = await html5QrCode.scanFile(file, true);
      setScanResult(decodedText);
      html5QrCode.clear();
    } catch (err) {
      console.error(err);
      setError("Image was too blurry or didn't contain a readable barcode. Please type it in below.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualScan = () => {
    if (manualCode.trim()) {
      destroyScanner();
      setProductData(null);
      setError('');
      setAutoSaved(false);
      setScanResult(manualCode.trim());
    }
  };

  const handleRestartScanner = async () => {
    await destroyScanner();
    setError('');
    setProductData(null);
    setAutoSaved(false);
    setManualCode('');
    setScanResult('');
    setCameraActive(true);
  };

  const handleStopCamera = async () => {
    setCameraActive(false);
    await destroyScanner();
  };

  const numericWeight = Number(weight) || 0;
  const caloriesForWeight = ((productData?.nutriments?.['energy-kcal_100g'] || 0) * numericWeight / 100).toFixed(1);
  const proteinForWeight = ((productData?.nutriments?.proteins_100g || 0) * numericWeight / 100).toFixed(1);
  const carbsForWeight = ((productData?.nutriments?.carbohydrates_100g || 0) * numericWeight / 100).toFixed(1);
  const fatForWeight = ((productData?.nutriments?.fat_100g || 0) * numericWeight / 100).toFixed(1);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
        <h1 className="title-gradient" style={{ fontSize: '2.5rem' }}>Barcode Scanner</h1>
        {scanResult && (
          <button className="btn-secondary" onClick={handleRestartScanner} style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <RefreshCw size={18} /> Scan Another
          </button>
        )}
      </div>

      {!scanResult && !loading && (
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Hold a product barcode up to the camera or upload an image.</p>
          <div id={readerId} style={{ width: '100%', maxWidth: '500px', margin: '0 auto', border: 'none', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-4)', background: '#fff' }} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <button className="btn-secondary" onClick={cameraActive ? handleStopCamera : handleRestartScanner}>
              {cameraActive ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-4)' }}>
            {cameraReady ? 'Camera is live. Point the barcode inside the frame.' : 'Allow camera access if prompted. The scanner will start automatically.'}
          </p>
          
          <div style={{ margin: 'var(--space-4) 0', padding: 'var(--space-4)', borderTop: '1px solid var(--border-medium)' }}>
             <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Or upload a picture of a barcode:</p>
             <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
               <Upload size={18} /> Upload Image
               <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
             </label>
          </div>

          <div style={{ margin: 'var(--space-4) 0', padding: 'var(--space-4)', borderTop: '1px solid var(--border-medium)' }}>
             <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Having trouble scanning? Enter manually:</p>
             <div style={{ display: 'flex', gap: 'var(--space-2)', maxWidth: '400px', margin: '0 auto' }}>
               <input type="text" className="input-field" placeholder="E.g. 5000159461122" value={manualCode} onChange={(e) => setManualCode(e.target.value)} />
               <button className="btn-primary" onClick={handleManualScan} disabled={!manualCode}>Search</button>
             </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
          <div className="floating" style={{ fontSize: '2rem' }}>🔍</div>
          <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-main)', fontWeight: 600 }}>Analyzing {scanResult ? `Barcode ${scanResult}` : 'Image'}...</p>
        </div>
      )}

      {error && !loading && (
        <div className="glass-panel" style={{ border: '1px solid var(--error)', background: 'rgba(255, 71, 105, 0.1)', marginBottom: 'var(--space-4)' }}>
          <p style={{ color: 'var(--error)', fontWeight: 600, textAlign: 'center' }}>{error}</p>
          <button className="btn-secondary" style={{ marginTop: 'var(--space-2)', width: '100%' }} onClick={handleRestartScanner}>Try Again</button>
        </div>
      )}

      {productData && !loading && !error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel">
          <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {productData.image_url && (
              <img 
                src={productData.image_url} 
                alt={productData.product_name} 
                style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
              />
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: 'var(--space-1)' }}>
                {productData.product_name || 'Unknown Product'}
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>Brand: {productData.brands || 'N/A'}</p>
              {autoSaved && (
                <div style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-3)', background: 'rgba(111, 255, 180, 0.14)', border: '1px solid rgba(111, 255, 180, 0.35)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }}>
                  This scan was enriched with Gemini and automatically saved to your tracking history.
                </div>
              )}
              {productData && (
                <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Gemini Product Details</div>
                  <p style={{ margin: '0 0 var(--space-2) 0', fontWeight: 600 }}>{productData.product_name || productData.barcode}</p>
                  <p style={{ margin: '0 0 var(--space-2) 0' }}>{productData.description || 'No description available.'}</p>
                  <p style={{ margin: '0 0 var(--space-2) 0' }}>Packaging: {productData.packaging || 'N/A'}</p>
                  <p style={{ margin: '0 0 var(--space-2) 0' }}>Serving Size: {productData.serving_size || 'N/A'}</p>
                  <p style={{ margin: '0 0 var(--space-2) 0' }}>Allergens: {Array.isArray(productData.allergens) ? productData.allergens.join(', ') : productData.allergens || 'N/A'}</p>
                  <p style={{ margin: '0 0 var(--space-2) 0' }}>Categories: {Array.isArray(productData.categories) ? productData.categories.join(', ') : productData.categories || 'N/A'}</p>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <label className="label" style={{ marginBottom: 0 }}>Serving Weight (g):</label>
                <input type="number" className="input-field" value={weight} onChange={e => setWeight(e.target.value)} style={{ width: '100px', textAlign: 'center' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(120px, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Energy (kcal)</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{caloriesForWeight}</div>
                </div>
                <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Proteins (g)</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{proteinForWeight}</div>
                </div>
                <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Carbs (g)</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{carbsForWeight}</div>
                </div>
                <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fat (g)</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{fatForWeight}</div>
                </div>
                <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nutri-Score</div>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', fontSize: '1.2rem' }}>
                    {productData.nutriscore_grade || 'N/A'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', color: 'var(--primary)', fontWeight: 600 }}>
                <CheckCircle size={18} /> Tracking entry saved automatically
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
