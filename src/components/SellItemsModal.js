import React, { useState } from 'react';
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
  useTheme
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Print as PrintIcon, CameraAlt as CameraIcon } from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

export default function SellItemsModal({ open, onClose, items, onSaleComplete }) {
  const theme = useTheme();
  const [saleItems, setSaleItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [receiptNamingMethod, setReceiptNamingMethod] = useState('sequential'); // 'sequential' or 'datetime'
  const [totalDiscount, setTotalDiscount] = useState(0); // Total discount for all items
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setSaleItems([{ itemCode: '', quantity: 1, discount: 0 }]); // Start with one empty row
      setError('');
      setLoading(false);
    }
  }, [open]);

  const handleAddItem = () => {
    setSaleItems([...saleItems, { itemCode: '', quantity: 1, discount: 0 }]);
  };

  const handleItemCodeChange = (idx, itemCode) => {
    const updatedItems = saleItems.map((row, i) =>
      i === idx ? { ...row, itemCode } : row
    );
    setSaleItems(updatedItems);

    // Auto-add next row if this is the last row and it's not empty
    if (idx === saleItems.length - 1 && itemCode) {
      setSaleItems([...updatedItems, { itemCode: '', quantity: 1, discount: 0 }]);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera on mobile
        } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied. Please allow camera permission and try again.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraOpen(false);
  };

  const handleCameraScan = () => {
    setCameraOpen(true);
    startCamera();
  };

  const handleScanResult = (code) => {
    setScannedCode(code);
    // Find the first empty row or add a new one
    const emptyRowIndex = saleItems.findIndex(row => !row.itemCode);
    if (emptyRowIndex !== -1) {
      handleItemCodeChange(emptyRowIndex, code);
    } else {
      setSaleItems([...saleItems, { itemCode: code, quantity: 1, discount: 0 }]);
    }
    stopCamera();
  };

  // Cleanup camera on unmount
  React.useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

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

  const getItem = (itemCode) => items.find(i => i.itemCode === itemCode);

  const receiptRows = saleItems.map(row => {
    const item = getItem(row.itemCode);
    const quantity = parseInt(row.quantity) || 0;
    const price = item ? item.sellerPrice : 0;
    const itemDiscount = parseFloat(row.discount) || 0;
    const itemTotal = price * quantity;
    const itemDiscountAmount = (itemTotal * itemDiscount) / 100;
    const itemFinalTotal = itemTotal - itemDiscountAmount;
    
    return {
      name: item ? item.name : '',
      price,
      quantity,
      discount: itemDiscount,
      discountAmount: itemDiscountAmount,
      total: itemFinalTotal
    };
  });
  
  const subtotal = receiptRows.reduce((sum, r) => sum + (r.price * r.quantity), 0);
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
      // Sequential numbering
      const userId = auth.currentUser?.uid;
      if (!userId) return 'receipt.pdf';

      try {
        // Get or create receipt counter for this user
        const counterRef = doc(db, 'receiptCounters', userId);
        const counterDoc = await getDoc(counterRef);
        
        let nextNumber = 1;
        if (counterDoc.exists()) {
          nextNumber = counterDoc.data().count + 1;
        }
        
        // Update the counter
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
      console.log('Starting sale process...', saleItems);
      
      // Update inventory in Firestore
      for (const row of saleItems) {
        const item = getItem(row.itemCode);
        console.log('Updating item:', item.name, 'from', item.quantity, 'to', item.quantity - parseInt(row.quantity));
        
        const newQty = item.quantity - parseInt(row.quantity);
        const itemRef = doc(db, 'inventory', item.id);
        await updateDoc(itemRef, { quantity: newQty });
        console.log('Successfully updated item:', item.name);
      }
      
      console.log('All inventory updates completed, generating PDF...');
      
      try {
        const fileName = await generateReceiptFileName();
        const docPDF = new jsPDF();
        
        // Load settings first
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
        
        // Professional Header Design
        docPDF.setFontSize(24);
        docPDF.setFont(undefined, 'bold');
        docPDF.text('SALES RECEIPT', 14, 20);
        
        // Shop Details at Top Right
        docPDF.setFontSize(12);
        docPDF.setFont(undefined, 'bold');
        const shopName = settings?.shopName || 'Your Store';
        const shopAddress = settings?.address || 'Your Address';
        const shopPhone = settings?.phoneNumber || 'Your Phone';
        
        // Calculate right alignment position
        const pageWidth = docPDF.internal.pageSize.getWidth();
        const shopNameWidth = docPDF.getTextWidth(shopName);
        const shopAddressWidth = docPDF.getTextWidth(shopAddress);
        const shopPhoneWidth = docPDF.getTextWidth(shopPhone);
        
        docPDF.text(shopName, pageWidth - shopNameWidth - 14, 20);
        docPDF.setFont(undefined, 'normal');
        docPDF.text(shopAddress, pageWidth - shopAddressWidth - 14, 28);
        docPDF.text(shopPhone, pageWidth - shopPhoneWidth - 14, 36);
        
        // Receipt Details Section with Box
        docPDF.setFontSize(10);
        docPDF.setFont(undefined, 'normal');
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString();
        
        // Receipt info in a professional box
        docPDF.setDrawColor(0, 0, 0);
        docPDF.setLineWidth(0.5);
        docPDF.rect(14, 45, 80, 20);
        
        docPDF.text(`Date: ${dateStr}`, 18, 52);
        docPDF.text(`Time: ${timeStr}`, 18, 58);
        
        if (receiptNamingMethod === 'sequential') {
          const receiptNumber = fileName.replace('receipt', '').replace('.pdf', '');
          docPDF.text(`Receipt #: ${receiptNumber}`, 18, 64);
        }
        
        // Customer section
        docPDF.text('Customer: Walk-in Customer', 18, 70);
        
        autoTable(docPDF, {
          startY: 80,
          head: [['Name', 'Unit Price', 'Quantity', 'Discount %', 'Total']],
          body: receiptRows.map(r => [r.name, `PKR ${r.price}`, r.quantity, `${r.discount}%`, `PKR ${r.total.toFixed(2)}`]),
          headStyles: {
            fillColor: [0, 0, 0],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
          },
          bodyStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          },
          columnStyles: {
            0: { halign: 'left' }, // Name column left aligned
            4: { halign: 'right' } // Total column right aligned
          },
          styles: {
            fontSize: 10,
            cellPadding: 4
          },
          margin: { left: 14, right: 14 }
        });
        
        // Professional Total Section with Box
        const yPosition = docPDF.lastAutoTable.finalY + 15;
        
        // Draw a box around the totals
        const boxHeight = 30 + (totalItemDiscounts > 0 ? 8 : 0) + (totalDiscountAmount > 0 ? 8 : 0);
        docPDF.setDrawColor(0, 0, 0);
        docPDF.setLineWidth(0.5);
        docPDF.rect(14, yPosition - 5, 80, boxHeight);
        
        // Right-align the totals
        const rightAlign = 14 + 80 - 5;
        
        docPDF.setFontSize(11);
        docPDF.setFont(undefined, 'normal');
        const subtotalText = `Subtotal: PKR ${subtotal.toFixed(2)}`;
        const subtotalWidth = docPDF.getTextWidth(subtotalText);
        docPDF.text(subtotalText, rightAlign - subtotalWidth, yPosition);
        
        let currentY = yPosition + 8;
        
        if (totalItemDiscounts > 0) {
          const itemDiscountText = `Item Discounts: -PKR ${totalItemDiscounts.toFixed(2)}`;
          const itemDiscountWidth = docPDF.getTextWidth(itemDiscountText);
          docPDF.text(itemDiscountText, rightAlign - itemDiscountWidth, currentY);
          currentY += 8;
        }
        
        if (totalDiscountAmount > 0) {
          const totalDiscountText = `Total Discount (${totalDiscount}%): -PKR ${totalDiscountAmount.toFixed(2)}`;
          const totalDiscountWidth = docPDF.getTextWidth(totalDiscountText);
          docPDF.text(totalDiscountText, rightAlign - totalDiscountWidth, currentY);
          currentY += 8;
        }
        
        // Grand Total with emphasis
        docPDF.setFontSize(14);
        docPDF.setFont(undefined, 'bold');
        const grandTotalText = `Grand Total: PKR ${grandTotal.toFixed(2)}`;
        const grandTotalWidth = docPDF.getTextWidth(grandTotalText);
        docPDF.text(grandTotalText, rightAlign - grandTotalWidth, currentY + 5);
        
        // Professional Footer Section
        let footerY = currentY + 25;
        
        // Thank you message
        docPDF.setFontSize(12);
        docPDF.setFont(undefined, 'bold');
        docPDF.text('Thank you for your business!', 14, footerY);
        footerY += 15;
        
        // Shop details in footer
        docPDF.setFontSize(10);
        docPDF.setFont(undefined, 'normal');
        
        if (settings.shopName) {
          docPDF.text(`Store: ${settings.shopName}`, 14, footerY);
          footerY += 6;
        }
        
        if (settings.phoneNumber) {
          docPDF.text(`Phone: ${settings.phoneNumber}`, 14, footerY);
          footerY += 6;
        }
        
        if (settings.address) {
          docPDF.text(`Address: ${settings.address}`, 14, footerY);
          footerY += 6;
        }
        
        // Footer line
        footerY += 5;
        docPDF.setDrawColor(0, 0, 0);
        docPDF.setLineWidth(0.5);
        docPDF.line(14, footerY, pageWidth - 14, footerY);
        
        // Generated timestamp
        footerY += 8;
        docPDF.setFontSize(8);
        docPDF.setFont(undefined, 'italic');
        docPDF.text(`Receipt generated on ${dateStr} at ${timeStr}`, 14, footerY);
        
        docPDF.save(fileName);
        console.log('PDF generated successfully:', fileName);
      } catch (pdfErr) {
        console.error('PDF export error:', pdfErr);
        setError('Failed to generate PDF. Please check your browser and try again.');
        setLoading(false);
        return;
      }
      
      console.log('Sale completed successfully');
      onSaleComplete();
      onClose();
    } catch (err) {
      console.error('Sale process error:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      setError(`Failed to complete sale: ${err.message}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
          Sell Items & Generate Receipt
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddItem} disabled={loading}>
              Add Item
            </Button>
            <Button 
              variant="contained" 
              startIcon={<CameraIcon />} 
              onClick={handleCameraScan} 
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                }
              }}
            >
              Scan Barcode
            </Button>
          </Box>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'info.light',
            px: 2,
            py: 1,
            borderRadius: 1
          }}>
            <Typography variant="body2" sx={{ color: 'info.contrastText', fontWeight: 500 }}>
              📱 Scanner Ready: Focus on "Item Code" field and scan barcodes
            </Typography>
          </Box>
        </Box>
        
        {/* Receipt Naming Method Selection */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Receipt Naming Method</InputLabel>
            <Select
              value={receiptNamingMethod}
              label="Receipt Naming Method"
              onChange={(e) => setReceiptNamingMethod(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="sequential">Sequential (receipt1, receipt2, ...)</MenuItem>
              <MenuItem value="datetime">Date & Time (receipt_2024-01-15_14-30-25.pdf)</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {receiptNamingMethod === 'sequential' 
              ? 'Receipts will be numbered sequentially for your account' 
              : 'Receipts will include the exact date and time of sale'
            }
          </Typography>
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: '0.875rem', fontWeight: 600, py: 1 }}>Item Code</TableCell>
                <TableCell sx={{ fontSize: '0.875rem', fontWeight: 600, py: 1 }}>Item Name</TableCell>
                <TableCell sx={{ fontSize: '0.875rem', fontWeight: 600, py: 1 }}>Unit Price</TableCell>
                <TableCell sx={{ fontSize: '0.875rem', fontWeight: 600, py: 1 }}>Quantity</TableCell>
                <TableCell sx={{ fontSize: '0.875rem', fontWeight: 600, py: 1 }}>Discount %</TableCell>
                <TableCell sx={{ fontSize: '0.875rem', fontWeight: 600, py: 1 }}>Total</TableCell>
                <TableCell sx={{ fontSize: '0.875rem', fontWeight: 600, py: 1 }}>Remove</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {saleItems.map((row, idx) => {
                const item = getItem(row.itemCode);
                return (
                  <TableRow key={idx}>
                    <TableCell sx={{ minWidth: 150, py: 1 }}>
                      <TextField
                        label="Item Code"
                        value={row.itemCode}
                        onChange={(e) => {
                          handleChange(idx, 'itemCode', e.target.value);
                          handleItemCodeChange(idx, e.target.value);
                        }}
                        onKeyDown={(e) => {
                          // Handle scanner input (usually ends with Enter)
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            // Auto-focus next field or add new row
                            if (idx === saleItems.length - 1) {
                              handleAddItem();
                            }
                          }
                        }}
                        fullWidth
                        disabled={loading}
                        size="small"
                        placeholder="Scan barcode or type item code"
                        sx={{ 
                          fontSize: '0.875rem',
                          '& .MuiInputBase-input': {
                            fontFamily: 'monospace' // Better for barcode display
                          }
                        }}
                        error={row.itemCode && !item}
                        helperText={row.itemCode && !item ? 'Item not found' : 'Scan barcode or type code'}
                        autoFocus={idx === 0} // Auto-focus first row
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {item ? item.name : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {item ? `PKR ${item.sellerPrice}` : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <TextField
                        type="number"
                        value={row.quantity}
                        onChange={e => handleChange(idx, 'quantity', e.target.value)}
                        inputProps={{ min: 1, max: item ? item.quantity : undefined }}
                        fullWidth
                        disabled={loading || !item}
                        size="small"
                        sx={{ fontSize: '0.875rem' }}
                      />
                      {item && <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Stock: {item.quantity}</Typography>}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <TextField
                        type="number"
                        value={row.discount}
                        onChange={e => handleItemDiscountChange(idx, e.target.value)}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                        fullWidth
                        size="small"
                        disabled={loading || !item}
                        placeholder="0"
                        sx={{ fontSize: '0.875rem' }}
                        InputProps={{
                          endAdornment: '%'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {item ? `PKR ${(item.sellerPrice * (parseInt(row.quantity) || 0) * (1 - (parseFloat(row.discount) || 0) / 100)).toFixed(2)}` : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <IconButton onClick={() => handleRemoveItem(idx)} disabled={loading} size="small">
                        <RemoveIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label="Total Discount %"
              type="number"
              value={totalDiscount}
              onChange={e => setTotalDiscount(parseFloat(e.target.value) || 0)}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              size="small"
              disabled={loading}
              placeholder="0"
              sx={{ width: 140, fontSize: '0.875rem' }}
              InputProps={{
                endAdornment: '%'
              }}
            />
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
              Grand Total: PKR {grandTotal.toFixed(2)}
            </Typography>
          </Box>
          {totalDiscount > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              Total Discount: PKR {totalDiscountAmount.toFixed(2)}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <PrintIcon />}
          onClick={handleSellAndExport}
          disabled={loading || saleItems.length === 0}
        >
          {loading ? 'Processing...' : 'Sell & Export PDF'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Camera Scanner Modal */}
    <Dialog
      open={cameraOpen}
      onClose={stopCamera}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        background: theme.palette.mode === 'dark' 
          ? 'rgba(15, 23, 42, 0.8)'
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid',
        borderColor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.1)',
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CameraIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Scan Barcode/QR Code
            </Typography>
          </Box>
          <Button onClick={stopCamera} variant="outlined" size="small">
            Close
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ 
          position: 'relative',
          borderRadius: 2,
          overflow: 'hidden',
          border: '2px solid',
          borderColor: 'primary.main',
          background: '#000'
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '300px',
              objectFit: 'cover'
            }}
          />
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '100px',
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 1,
            background: 'rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="body2" sx={{ color: 'white', textAlign: 'center' }}>
              Position barcode here
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Point your camera at a barcode or QR code to scan
          </Typography>
          
          {/* Manual input fallback */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Or enter code manually:
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter barcode/QR code"
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && scannedCode) {
                  handleScanResult(scannedCode);
                }
              }}
              sx={{ mb: 2 }}
            />
            <Button 
              variant="contained" 
              onClick={() => handleScanResult(scannedCode)}
              disabled={!scannedCode}
              fullWidth
            >
              Add Item
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
    </>
  );
} 