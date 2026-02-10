import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Tabs,
  Tab,
  Autocomplete
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Print as PrintIcon, CameraAlt as CameraIcon, Keyboard as KeyboardIcon } from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function SellItemsModal({ open, onClose, items, onSaleComplete }) {
  const theme = useTheme();
  const [saleItems, setSaleItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [receiptNamingMethod, setReceiptNamingMethod] = useState('sequential');
  const [totalDiscount, setTotalDiscount] = useState(0);
  
  // Barcode scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTab, setScannerTab] = useState(0); // 0=Barcode, 1=Manual
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (open) {
      setSaleItems([{ itemCode: '', quantity: 1, discount: 0 }]);
      setError('');
      setLoading(false);
      setTotalDiscount(0);
    }
  }, [open]);

  // Cleanup scanner on close
  useEffect(() => {
    return () => stopScanning();
  }, []);

  const stopScanning = () => {
    isScanningRef.current = false;
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
  };

  const startBarcodeScanning = async () => {
    if (isScanningRef.current) return;
    try {
      setError('');
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      isScanningRef.current = true;

      const videoInputDevices = await codeReader.listVideoInputDevices();
      if (videoInputDevices.length === 0) {
        setError('No camera found. Use manual entry.');
        setScannerTab(1);
        return;
      }

      const selectedDeviceId = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      )?.deviceId || videoInputDevices[0].deviceId;

      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result) => {
          if (result && isScanningRef.current) {
            const code = result.getText();
            isScanningRef.current = false;
            handleScanResult(code);
            stopScanning();
            setScannerOpen(false);
          }
        }
      );
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Use manual entry.');
      setScannerTab(1);
    }
  };

  useEffect(() => {
    if (scannerOpen && scannerTab === 0) {
      startBarcodeScanning();
    } else {
      stopScanning();
    }
  }, [scannerOpen, scannerTab]);

  const handleScanResult = (code) => {
    // Find first empty row or add new
    const emptyRowIndex = saleItems.findIndex(row => !row.itemCode);
    if (emptyRowIndex !== -1) {
      handleItemCodeChange(emptyRowIndex, code);
    } else {
      setSaleItems([...saleItems, { itemCode: code, quantity: 1, discount: 0 }]);
    }
    setManualCode('');
  };

  const handleAddItem = () => {
    setSaleItems([...saleItems, { itemCode: '', quantity: 1, discount: 0 }]);
  };

  const handleItemCodeChange = (idx, itemCode) => {
    const updatedItems = saleItems.map((row, i) =>
      i === idx ? { ...row, itemCode } : row
    );
    setSaleItems(updatedItems);

    if (idx === saleItems.length - 1 && itemCode) {
      setSaleItems([...updatedItems, { itemCode: '', quantity: 1, discount: 0 }]);
    }
  };

  const handleRemoveItem = (idx) => {
    setSaleItems(saleItems.filter((_, i) => i !== idx));
  };

  const handleItemDiscountChange = (idx, discount) => {
    const updatedItems = saleItems.map((row, i) =>
      i === idx ? { ...row, discount: parseFloat(discount) || 0 } : row
    );
    setSaleItems(updatedItems);
  };

  const handleChange = (idx, field, value) => {
    setSaleItems(saleItems.map((row, i) =>
      i === idx ? { ...row, [field]: value } : row
    ));
  };

  // Get item by code or name - case insensitive search
  const getItem = (searchTerm) => {
    if (!searchTerm) return null;
    const searchLower = searchTerm.toLowerCase().trim();
    return items.find(i => 
      i.itemCode?.toLowerCase() === searchLower || 
      i.name?.toLowerCase() === searchLower
    );
  };

  // Get filtered item suggestions for autocomplete
  const getItemSuggestions = (inputValue) => {
    if (!inputValue || inputValue.length < 1) return [];
    const searchLower = inputValue.toLowerCase().trim();
    
    return items
      .filter(i => 
        i.itemCode?.toLowerCase().includes(searchLower) || 
        i.name?.toLowerCase().includes(searchLower)
      )
      .map(i => ({
        label: `${i.name} (${i.itemCode})`,
        itemCode: i.itemCode,
        name: i.name,
        item: i
      }))
      .slice(0, 10); // Limit to 10 suggestions
  };

  const getItemPrice = (item) => {
    // Support both old items (sellerPrice) and new items (price)
    return item.price || item.sellerPrice || 0;
  };

  const receiptRows = saleItems.map(row => {
    const item = getItem(row.itemCode);
    const quantity = parseInt(row.quantity) || 0;
    const price = item ? getItemPrice(item) : 0;
    const itemDiscount = parseFloat(row.discount) || 0;
    const originalTotal = price * quantity;
    const discountAmount = (originalTotal * itemDiscount) / 100;
    const finalTotal = originalTotal - discountAmount;
    
    return {
      name: item ? item.name : '',
      price,
      quantity,
      discount: itemDiscount,
      discountAmount,
      originalTotal,
      total: finalTotal
    };
  });
  
  const subtotal = receiptRows.reduce((sum, r) => sum + r.originalTotal, 0);
  const totalItemDiscounts = receiptRows.reduce((sum, r) => sum + r.discountAmount, 0);
  const totalDiscountAmount = (subtotal * totalDiscount) / 100;
  const grandTotal = subtotal - totalItemDiscounts - totalDiscountAmount;

  const validateSale = () => {
    if (saleItems.length === 0) return 'Add at least one item.';
    for (const row of saleItems) {
      if (!row.itemCode) return 'Enter item code for each row.';
      if (!row.quantity || parseInt(row.quantity) <= 0) return 'Quantity must be at least 1.';
      const item = getItem(row.itemCode);
      if (!item) return `Item with code "${row.itemCode}" not found.`;
      if (parseInt(row.quantity) > item.quantity) return `Not enough stock for ${item.name}.`;
    }
    return '';
  };

  const generateReceiptFileName = async () => {
    if (receiptNamingMethod === 'datetime') {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
      return `receipt_${dateStr}.pdf`;
    } else {
      const userId = auth.currentUser?.uid;
      if (!userId) return 'receipt.pdf';

      try {
        const counterRef = doc(db, 'receiptCounters', userId);
        const counterDoc = await getDoc(counterRef);
        
        let nextNumber = 1;
        if (counterDoc.exists()) {
          nextNumber = counterDoc.data().count + 1;
        }
        
        await setDoc(counterRef, { count: nextNumber }, { merge: true });
        
        return `receipt${nextNumber}.pdf`;
      } catch (err) {
        console.error('Error getting receipt number:', err);
        return 'receipt.pdf';
      }
    }
  };

  const handleSellAndExport = async () => {
    setError('');
    const validation = validateSale();
    if (validation) {
      setError(validation);
      return;
    }
    setLoading(true);
    try {
      // Update inventory
      for (const row of saleItems) {
        const item = getItem(row.itemCode);
        const newQty = item.quantity - parseInt(row.quantity);
        const itemRef = doc(db, 'inventory', item.id);
        await updateDoc(itemRef, { quantity: newQty });
      }
      
      // Generate PDF
      const fileName = await generateReceiptFileName();
      const docPDF = new jsPDF();
      
      // Load settings
      let settings = {};
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const userDoc = doc(db, 'users', userId);
          const userData = await getDoc(userDoc);
          if (userData.exists() && userData.data().receiptSettings) {
            settings = userData.data().receiptSettings;
          }
        }
      } catch (settingsErr) {
        console.error('Error loading receipt settings:', settingsErr);
      }
      
      const pageWidth = docPDF.internal.pageSize.getWidth();
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();
      
      // Header
      docPDF.setFontSize(22);
      docPDF.setFont(undefined, 'bold');
      docPDF.text('SALES RECEIPT', 14, 20);
      
      // Shop Info (right side)
      docPDF.setFontSize(11);
      docPDF.setFont(undefined, 'bold');
      const shopName = settings?.shopName || 'Your Store';
      docPDF.text(shopName, pageWidth - 14, 20, { align: 'right' });
      docPDF.setFont(undefined, 'normal');
      if (settings?.address) {
        docPDF.text(settings.address, pageWidth - 14, 26, { align: 'right' });
      }
      if (settings?.phoneNumber) {
        docPDF.text(settings.phoneNumber, pageWidth - 14, 32, { align: 'right' });
      }
      
      // Receipt Info Box
      docPDF.setDrawColor(200, 200, 200);
      docPDF.setLineWidth(0.5);
      docPDF.rect(14, 38, 70, 22);
      docPDF.setFontSize(9);
      docPDF.text('Date: ' + dateStr, 18, 45);
      docPDF.text('Time: ' + timeStr, 18, 51);
      if (receiptNamingMethod === 'sequential') {
        const receiptNum = fileName.replace('receipt', '').replace('.pdf', '');
        docPDF.text('Receipt #: ' + receiptNum, 18, 57);
      }
      
      // Items Table - NEW FORMAT
      // Columns: Item | Qty | Price | Discount | Total
      const tableBody = receiptRows.map(r => [
        r.name,
        r.quantity.toString(),
        'PKR ' + r.price.toFixed(2),
        r.discount > 0 ? r.discount + '%' : '-',
        'PKR ' + r.total.toFixed(2)
      ]);
      
      autoTable(docPDF, {
        startY: 68,
        head: [['Item Name', 'Qty', 'Price', 'Discount', 'Total']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 10
        },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left' },
          1: { cellWidth: 15, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 35, halign: 'right' }
        },
        styles: {
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        margin: { left: 14, right: 14 }
      });
      
      // Totals Section
      const totalsY = docPDF.lastAutoTable.finalY + 10;
      
      // Right-aligned totals
      const rightX = pageWidth - 14;
      
      docPDF.setFontSize(10);
      docPDF.setFont(undefined, 'normal');
      docPDF.text('Subtotal:', rightX - 60, totalsY);
      docPDF.text('PKR ' + subtotal.toFixed(2), rightX, totalsY, { align: 'right' });
      
      let currentY = totalsY + 6;
      
      if (totalItemDiscounts > 0) {
        docPDF.text('Item Discounts:', rightX - 60, currentY);
        docPDF.text('-PKR ' + totalItemDiscounts.toFixed(2), rightX, currentY, { align: 'right' });
        currentY += 6;
      }
      
      if (totalDiscountAmount > 0) {
        docPDF.text('Additional Discount (' + totalDiscount + '%):', rightX - 60, currentY);
        docPDF.text('-PKR ' + totalDiscountAmount.toFixed(2), rightX, currentY, { align: 'right' });
        currentY += 6;
      }
      
      // Grand Total
      docPDF.setFontSize(13);
      docPDF.setFont(undefined, 'bold');
      docPDF.text('Grand Total:', rightX - 60, currentY + 4);
      docPDF.text('PKR ' + grandTotal.toFixed(2), rightX, currentY + 4, { align: 'right' });
      
      // Footer
      const footerY = currentY + 20;
      docPDF.setFontSize(11);
      docPDF.setFont(undefined, 'bold');
      docPDF.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
      
      docPDF.save(fileName);
      
      onSaleComplete();
      onClose();
    } catch (err) {
      console.error('Sale error:', err);
      setError('Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Sell Items & Generate Receipt
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddItem} disabled={loading}>
              Add Item
            </Button>
            <Button 
              variant="contained" 
              startIcon={<CameraIcon />} 
              onClick={() => setScannerOpen(true)} 
              disabled={loading}
            >
              Scan Barcode
            </Button>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Receipt Naming</InputLabel>
              <Select
                value={receiptNamingMethod}
                label="Receipt Naming"
                onChange={(e) => setReceiptNamingMethod(e.target.value)}
              >
                <MenuItem value="sequential">Sequential (receipt1, receipt2...)</MenuItem>
                <MenuItem value="datetime">Date & Time</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item Name / Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Discount %</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {saleItems.map((row, idx) => {
                  const item = getItem(row.itemCode);
                  const price = item ? getItemPrice(item) : 0;
                  const total = item ? price * (parseInt(row.quantity) || 0) * (1 - (parseFloat(row.discount) || 0) / 100) : 0;
                  
                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <Autocomplete
                          size="small"
                          freeSolo
                          options={getItemSuggestions(row.itemCode)}
                          value={row.itemCode}
                          onChange={(event, newValue) => {
                            if (typeof newValue === 'string') {
                              handleItemCodeChange(idx, newValue);
                            } else if (newValue && newValue.itemCode) {
                              handleItemCodeChange(idx, newValue.itemCode);
                            } else {
                              handleItemCodeChange(idx, '');
                            }
                          }}
                          onInputChange={(event, newInputValue) => {
                            handleItemCodeChange(idx, newInputValue);
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Type name or code"
                              error={row.itemCode && !item}
                              helperText={row.itemCode && !item ? 'Not found' : ''}
                            />
                          )}
                          renderOption={(props, option) => (
                            <li {...props} key={option.itemCode}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {option.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Code: {option.itemCode} • Stock: {option.item.quantity} • PKR {getItemPrice(option.item)}
                                </Typography>
                              </Box>
                            </li>
                          )}
                          sx={{ minWidth: 200 }}
                        />
                      </TableCell>
                      <TableCell>{item ? item.name : '-'}</TableCell>
                      <TableCell>{item ? 'PKR ' + price : '-'}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={row.quantity}
                          onChange={(e) => handleChange(idx, 'quantity', e.target.value)}
                          inputProps={{ min: 1, max: item?.quantity }}
                          disabled={!item}
                          sx={{ width: 70 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={row.discount}
                          onChange={(e) => handleItemDiscountChange(idx, e.target.value)}
                          inputProps={{ min: 0, max: 100 }}
                          disabled={!item}
                          sx={{ width: 80 }}
                          placeholder="0%"
                        />
                      </TableCell>
                      <TableCell>{item ? 'PKR ' + total.toFixed(2) : '-'}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleRemoveItem(idx)} size="small">
                          <RemoveIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mt: 2 }}>
            <TextField
              label="Extra Discount %"
              type="number"
              size="small"
              value={totalDiscount}
              onChange={(e) => setTotalDiscount(parseFloat(e.target.value) || 0)}
              inputProps={{ min: 0, max: 100 }}
              sx={{ width: 130 }}
            />
            <Typography variant="h6">
              Total: PKR {grandTotal.toFixed(2)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <PrintIcon />}
            onClick={handleSellAndExport}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Sell & Print Receipt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Barcode Scanner Dialog */}
      <Dialog open={scannerOpen} onClose={() => { stopScanning(); setScannerOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Scan Item Code</Typography>
            <Button onClick={() => { stopScanning(); setScannerOpen(false); }} size="small">Close</Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={scannerTab} onChange={(e, v) => setScannerTab(v)} sx={{ mb: 2 }}>
            <Tab icon={<CameraIcon />} label="Scan Barcode/QR" />
            <Tab icon={<KeyboardIcon />} label="Type Manually" />
          </Tabs>

          {scannerTab === 0 ? (
            <Box sx={{ position: 'relative', height: 250, bgcolor: 'black', borderRadius: 2, overflow: 'hidden' }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
              <Box sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <Box sx={{ width: 200, height: 100, border: '3px solid #3b82f6', borderRadius: 1 }} />
              </Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  position: 'absolute', 
                  bottom: 8, 
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.6)',
                  px: 1,
                  borderRadius: 1
                }}
              >
                Point camera at barcode/QR
              </Typography>
            </Box>
          ) : (
            <Box sx={{ py: 2 }}>
              <TextField
                fullWidth
                label="Enter Item Code"
                placeholder="Type barcode, QR code, or any code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && manualCode.trim()) {
                  handleScanResult(manualCode.trim());
                  setScannerOpen(false);
                }}}
                autoFocus
              />
              <Button
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => {
                  if (manualCode.trim()) {
                    handleScanResult(manualCode.trim());
                    setScannerOpen(false);
                  }
                }}
                disabled={!manualCode.trim()}
              >
                Add Item
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}