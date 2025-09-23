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
  AppBar,
  Toolbar,
  Avatar,
  Chip,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { auth, db } from './firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import AddItemModal from './components/AddItemModal';
import InventoryTable from './components/InventoryTable';
import EditItemModal from './components/EditItemModal';
import SellItemsModal from './components/SellItemsModal';
import ProfileDrawer from './components/ProfileDrawer';

export default function Inventory({ isDarkMode, onThemeChange }) {
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
    { title: 'Total Items', value: totalItems.toString(), icon: <InventoryIcon />, color: 'primary.main' },
    { title: 'Low Stock', value: lowStockItems.toString(), icon: <WarningIcon />, color: 'warning.main' },
    { title: 'Out of Stock', value: outOfStockItems.toString(), icon: <ShoppingCartIcon />, color: 'error.main' },
    { title: 'Categories', value: categories.toString(), icon: <DashboardIcon />, color: 'success.main' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <InventoryIcon sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
              Inventory Manager
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton>
              <NotificationsIcon />
            </IconButton>
            <IconButton onClick={() => setProfileDrawerOpen(true)}>
              <Avatar 
                src={auth.currentUser?.photoURL}
                sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}
              >
                {auth.currentUser?.displayName?.charAt(0)?.toUpperCase() || auth.currentUser?.email?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Fade in timeout={800}>
          <Box>
            {/* Welcome Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                Welcome back! 👋
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                Here's what's happening with your inventory today
              </Typography>
              
              {/* Portfolio Introduction */}
              <Box sx={{ 
                p: 3, 
                bgcolor: 'primary.main', 
                color: 'white', 
                borderRadius: 3,
                mb: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  Welcome to Your Inventory Dashboard! 🎉
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
                  You're now using a powerful inventory management system designed to streamline your business operations. 
                  Track your stock, manage sales, generate receipts, and get real-time insights into your inventory performance.
                </Typography>
              </Box>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {stats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
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
              <Grid item xs={12} md={8}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                      Quick Actions
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
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
                      <Grid item xs={12} sm={6}>
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
              
              <Grid item xs={12} md={4}>
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
                  <Typography variant="body2" color="text.secondary">Buyer Price</Typography>
                  <Typography variant="body1">${selectedItem.buyerPrice}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Seller Price</Typography>
                  <Typography variant="body1">${selectedItem.sellerPrice}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Quantity</Typography>
                  <Typography variant="body1">{selectedItem.quantity}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Profit Margin</Typography>
                  <Typography variant="body1" color="success.main">
                    {((selectedItem.sellerPrice - selectedItem.buyerPrice) / selectedItem.buyerPrice * 100).toFixed(1)}%
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
    </Box>
  );
} 