import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Chip,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  BusinessCenter as BusinessIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
// import { useNavigate } from 'react-router-dom'; // Removed unused import
import { auth, db } from './firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import AddItemModal from './components/AddItemModal';
import InventoryTable from './components/InventoryTable';
import EditItemModal from './components/EditItemModal';
import SellItemsModal from './components/SellItemsModal';
import ProfileDrawer from './components/ProfileDrawer';

export default function Inventory({ isDarkMode, onThemeChange }) {
  const theme = useTheme();
  // const navigate = useNavigate(); // Removed unused variable
  const [items, setItems] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(
      collection(db, 'inventory'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsData);
    });

    return () => unsubscribe();
  }, []);

  const handleAddItem = () => {
    setAddModalOpen(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  const handleItemAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSaleComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Calculate statistics
  const totalItems = items.length;
  const lowStockItems = items.filter(item => item.quantity <= 10 && item.quantity > 0).length;
  const outOfStockItems = items.filter(item => item.quantity === 0).length;
  const categories = new Set(items.map(item => item.category || 'Uncategorized')).size;

  const stats = [
    { title: 'Total Items', value: totalItems.toString(), icon: <BusinessIcon />, color: 'primary.main' },
    { title: 'Low Stock', value: lowStockItems.toString(), icon: <WarningIcon />, color: 'warning.main' },
    { title: 'Out of Stock', value: outOfStockItems.toString(), icon: <ShoppingCartIcon />, color: 'error.main' },
    { title: 'Categories', value: categories.toString(), icon: <DashboardIcon />, color: 'success.main' },
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e3f2fd 100%)',
      position: 'relative'
    }}>
      {/* Professional Header */}
      <Box sx={{ 
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
        color: 'white',
        py: 2,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }} />
        
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: 2, 
                mr: 3,
                backdropFilter: 'blur(10px)'
              }}>
                <BusinessIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.5, fontSize: '1.1rem' }}>
                  InventoryPro Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem' }}>
                  Welcome back, {auth.currentUser?.displayName || 'User'}! 👋
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                px: 2,
                py: 1,
                borderRadius: 2,
                backdropFilter: 'blur(10px)'
              }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  bgcolor: '#10b981', 
                  borderRadius: '50%',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 }
                  },
                  animation: 'pulse 2s infinite'
                }} />
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, fontSize: '0.7rem' }}>
                  System Online
                </Typography>
              </Box>
              
              <IconButton 
                onClick={() => setProfileDrawerOpen(true)}
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                <Avatar 
                  src={auth.currentUser?.photoURL}
                  sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 40, height: 40 }}
                >
                  {auth.currentUser?.displayName?.charAt(0)?.toUpperCase() || auth.currentUser?.email?.charAt(0)?.toUpperCase()}
                </Avatar>
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Fade in timeout={800}>
          <Box>
            {/* Welcome Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                Dashboard Overview
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Monitor your inventory performance and business metrics in real-time
              </Typography>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {stats.map((stat, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {stat.title}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: `${stat.color}15`,
                          color: stat.color 
                        }}>
                          {stat.icon}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Quick Actions */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                      Quick Actions
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          fullWidth
                          onClick={handleAddItem}
                          sx={{ py: 2, borderRadius: 2 }}
                        >
                          Add New Item
                        </Button>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Button
                          variant="outlined"
                          startIcon={<TrendingUpIcon />}
                          fullWidth
                          onClick={() => setSellModalOpen(true)}
                          sx={{ py: 2, borderRadius: 2 }}
                        >
                          Sell Items
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                      System Status
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Database</Typography>
                        <Chip label="Online" color="success" size="small" icon={<CheckCircleIcon />} />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Sync Status</Typography>
                        <Chip label="Active" color="success" size="small" icon={<CheckCircleIcon />} />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Last Backup</Typography>
                        <Typography variant="body2" color="text.secondary">2 hours ago</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Inventory Table */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Inventory Items
                </Typography>
                <InventoryTable 
                  onEditItem={handleEditItem}
                  onViewItem={handleViewItem}
                  refreshTrigger={refreshTrigger}
                />
              </CardContent>
            </Card>
          </Box>
        </Fade>
      </Container>

      {/* Add Item Modal */}
      <AddItemModal 
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onItemAdded={handleItemAdded}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        item={selectedItem}
        onItemUpdated={handleItemAdded}
      />

      {/* View Item Modal */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Item Details</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{selectedItem.name}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Profit Percentage</Typography>
                  <Typography 
                    variant="body1" 
                    color={((selectedItem.sellerPrice - selectedItem.buyerPrice) / selectedItem.buyerPrice * 100) > 0 ? 'success.main' : 'error.main'}
                  >
                    {((selectedItem.sellerPrice - selectedItem.buyerPrice) / selectedItem.buyerPrice * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Seller Price</Typography>
                  <Typography variant="body1">PKR {selectedItem.sellerPrice}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Quantity</Typography>
                  <Typography variant="body1">{selectedItem.quantity}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Value</Typography>
                  <Typography variant="body1" color="primary.main">
                    PKR {(selectedItem.sellerPrice * selectedItem.quantity).toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Sell Items Modal */}
      <SellItemsModal
        open={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        items={items}
        onSaleComplete={handleSaleComplete}
      />

      {/* Profile Drawer */}
      <ProfileDrawer
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        user={auth.currentUser}
        onThemeChange={onThemeChange}
        isDarkMode={isDarkMode}
      />

      {/* Professional Footer */}
      <Box sx={{ 
        mt: 6,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        color: 'white',
        py: 4
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon sx={{ fontSize: 20, mr: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  InventoryPro
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 3, lineHeight: 1.5, fontSize: '0.8rem' }}>
                Professional inventory management system designed for modern businesses. 
                Streamline your operations with real-time tracking, automated reports, and seamless integration.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}>
                  📧
                </Box>
                <Box sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}>
                  📱
                </Box>
                <Box sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}>
                  🌐
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: '0.9rem' }}>
                Company
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', '&:hover': { color: 'white' }, fontSize: '0.8rem' }}>
                  About Us
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', '&:hover': { color: 'white' }, fontSize: '0.8rem' }}>
                  Our Team
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', '&:hover': { color: 'white' }, fontSize: '0.8rem' }}>
                  Careers
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', '&:hover': { color: 'white' }, fontSize: '0.8rem' }}>
                  News
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: '0.9rem' }}>
                Support
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', '&:hover': { color: 'white' }, fontSize: '0.8rem' }}>
                  Help Center
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', '&:hover': { color: 'white' }, fontSize: '0.8rem' }}>
                  Documentation
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', '&:hover': { color: 'white' }, fontSize: '0.8rem' }}>
                  API Reference
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', '&:hover': { color: 'white' }, fontSize: '0.8rem' }}>
                  Status
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: '0.9rem' }}>
                Contact
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem' }}>
                  📧 amjadhussnain5agmail.com
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem' }}>
                  📞 +92-3116369826
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem' }}>
                  🇵🇰 Pakistan
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: '0.9rem' }}>
                Legal
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', '&:hover': { color: 'white' }, fontSize: '0.8rem' }}>
                  Privacy Policy
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', '&:hover': { color: 'white' }, fontSize: '0.8rem' }}>
                  Terms of Service
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', '&:hover': { color: 'white' }, fontSize: '0.8rem' }}>
                  Cookie Policy
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', '&:hover': { color: 'white' }, fontSize: '0.8rem' }}>
                  GDPR
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
            mt: 4, 
            pt: 4, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              © 2024 InventoryPro. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Made with ❤️ for businesses worldwide
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
} 