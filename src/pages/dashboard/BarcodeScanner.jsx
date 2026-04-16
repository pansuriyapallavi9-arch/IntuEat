import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { RefreshCw, Upload, CheckCircle } from 'lucide-react';
import { UserContext } from '../../context/UserContext';

export default function BarcodeScanner() {
  const [scanResult, setScanResult] = useState('');
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weight, setWeight] = useState(100);
  const [manualCode, setManualCode] = useState('');
  const { addMealToHistory } = useContext(UserContext);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrcodeScanner;
    
    // Only mount scanner if we haven't scanned successfully yet
    if (!scanResult) {
      setTimeout(() => {
        try {
          html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
          scannerRef.current = html5QrcodeScanner;
          html5QrcodeScanner.render(
            (decodedText) => {
              setScanResult(decodedText);
              html5QrcodeScanner.clear();
            },
            () => { /* ignore empty scans */ }
          );
        } catch (err) {
          console.error("Scanner init error:", err);
        }
      }, 500); // small delay to ensure DOM is ready
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Clear error", e));
      }
    };
  }, [scanResult]);

  useEffect(() => {
    if (scanResult) {
      fetchProductDetails(scanResult);
    }
  }, [scanResult]);

  const fetchProductDetails = async (barcode) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const data = await response.json();
      if (data.status === 1) {
        setProductData(data.product);
      } else {
        setError('Product not found in database. Try another or check the code.');
      }
    } catch (err) {
      setError('Failed to fetch product data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    
    try {
      const html5QrCode = new Html5Qrcode("reader");
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
      if (scannerRef.current) scannerRef.current.clear().catch(() => {});
      setScanResult(manualCode.trim());
    }
  };

  const saveMeal = () => {
    if (productData) {
      const cals = ((productData.nutriments?.['energy-kcal_100g'] || 0) * weight / 100);
      const protein = ((productData.nutriments?.proteins_100g || 0) * weight / 100);
      const carbs = ((productData.nutriments?.carbohydrates_100g || 0) * weight / 100);
      const fat = ((productData.nutriments?.fat_100g || 0) * weight / 100);

      addMealToHistory({
        date: new Date().toLocaleDateString() + ', ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        type: 'Snack',
        name: productData.product_name || 'Unknown Product',
        cals: Math.round(cals),
        protein: parseFloat(protein.toFixed(1)),
        carbs: parseFloat(carbs.toFixed(1)),
        fat: parseFloat(fat.toFixed(1)),
        score: productData.nutriscore_grade === 'a' ? 9 : productData.nutriscore_grade === 'b' ? 7 : 5
      });
      alert(`Saved to history!`);
      setScanResult('');
      setProductData(null);
      setManualCode('');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
        <h1 className="title-gradient" style={{ fontSize: '2.5rem' }}>Barcode Scanner</h1>
        {scanResult && (
          <button className="btn-secondary" onClick={() => { setScanResult(''); setProductData(null); setError(''); }} style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <RefreshCw size={18} /> Scan Another
          </button>
        )}
      </div>

      {!scanResult && !loading && (
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Hold a product barcode up to the camera or upload an image.</p>
          <div id="reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', border: 'none', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-4)', background: '#fff' }} />
          
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
          {scanResult && <button className="btn-secondary" style={{ marginTop: 'var(--space-2)', width: '100%' }} onClick={() => {setScanResult(''); setError('');}}>Try Again</button>}
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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <label className="label" style={{ marginBottom: 0 }}>Serving Weight (g):</label>
                <input type="number" className="input-field" value={weight} onChange={e => setWeight(e.target.value)} style={{ width: '100px', textAlign: 'center' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(120px, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Energy (kcal)</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{((productData.nutriments?.['energy-kcal_100g'] || 0) * weight / 100).toFixed(1)}</div>
                </div>
                <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Proteins (g)</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{((productData.nutriments?.proteins_100g || 0) * weight / 100).toFixed(1)}</div>
                </div>
                <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Carbs (g)</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{((productData.nutriments?.carbohydrates_100g || 0) * weight / 100).toFixed(1)}</div>
                </div>
                <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fat (g)</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{((productData.nutriments?.fat_100g || 0) * weight / 100).toFixed(1)}</div>
                </div>
                <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nutri-Score</div>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', fontSize: '1.2rem' }}>
                    {productData.nutriscore_grade || 'N/A'}
                  </div>
                </div>
              </div>

              <button className="btn-primary" style={{ width: '100%' }} onClick={saveMeal}>
                <CheckCircle size={18} /> Save to History
              </button>

            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
