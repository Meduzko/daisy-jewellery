"use client";

import React, { useState, useContext } from 'react';
import { Box, Grid, TextField, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { CartContext } from '../../../context/CartContext';
import DepartmentAutocomplete from './DepartmentAutocomplete/DepartmentAutocomplete';
import CitySelect from './CitySelect/CitySelect';
import OrderList from '../../../order/OrderList/OrderList';
import ProductBuyButton from '../../Buttons/ProductBuy/ProductBuy';

import styles from './styles.module.css';

const OrderForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cityName: '',
    department: '',
  });

  const [statusMessage, setStatusMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [showModal, setShowModal] = useState(false);
  const { cartItems } = useContext(CartContext);

  const handleChange = (e, newName, newVal) => {
    const { name, value } = e.target;
    const n = newName || name;
    const v = newVal || value;

    setFormData({
      ...formData,
      [n]: v,
    });

    setTouchedFields({
      ...touchedFields,
      [n]: true,
    });

    // Remove error for the field if it's now valid
    setFormErrors((prevErrors) => {
      const updatedErrors = { ...prevErrors };
      if (n === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        delete updatedErrors[n];
      } else if (n === 'phone' && /^[0-9]{12}$/.test(v)) {
        delete updatedErrors[n];
      } else if (v?.trim() !== '') {
        delete updatedErrors[n];
      }
      return updatedErrors;
    });
  };

  const getOrderData = () => {
    return {
      formData,
      cartItems,
    };
  };

  const validateForm = () => {
    const errors = {};
    const { firstName, lastName, email, phone, cityName, department } = formData;

    if (!firstName) errors.firstName = 'Ім\'я є обов\'язковим полем';
    if (!lastName) errors.lastName = 'Прізвище є обов\'язковим полем';
    if (!email) {
      errors.email = 'Email є обов\'язковим полем';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Введіть валідну Email адресу';
    }
    if (!phone) {
      errors.phone = 'Телефон є обов\'язковим полем';
    } else if (!/^[0-9]{12}$/.test(phone)) {
      errors.phone = 'Введіть валідний номер телефону у форматі: 380######### (12 цифр)';
    }
    if (!cityName) errors.cityName = 'Населений пункт є обов\'язковим полем';
    if (!department) errors.department = 'Відділення є обов\'язковим полем';

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouchedFields({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      cityName: true,
      department: true,
    });
    if (!validateForm()) {
      return;
    }
    try {
      const orderData = getOrderData();
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await res.json();
      if (res.status === 200) {
        // setStatusMessage('Order submitted and email sent!');
        setShowModal(true);
      } else {
        setStatusMessage('Error' );
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setStatusMessage('Failed to submit order.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    window.location.href = '/';
  };

  return (
    <>
      <Box component="form">
        <Grid container spacing={2} className={styles.formGrid}>
          <Grid item xs={12}>
            <Typography className={styles.formTitle} variant="h4">Персональні данні</Typography>
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Ім'я"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              error={!!formErrors.firstName}
              helperText={formErrors.firstName}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Прізвище"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              error={!!formErrors.lastName}
              helperText={formErrors.lastName}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Телефон"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              error={!!formErrors.phone}
              helperText={formErrors.phone}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography className={styles.formTitle} variant="h4">Спосіб доставки</Typography>
          </Grid>

          <Grid item xs={12}>
            <CitySelect handleChange={handleChange} error={!!formErrors.cityName} helperText={formErrors.cityName} />
          </Grid>

          {formData.cityName && (
            <Grid item xs={12}>
              <DepartmentAutocomplete handleChange={handleChange} cityName={formData.cityName} error={!!formErrors.department} helperText={formErrors.department} />
            </Grid>
          )}
        </Grid>

        {/* Status Message */}
        {statusMessage && (
          <Typography variant="body1" color="error" sx={{ mt: 2 }}>
            {statusMessage}
          </Typography>
        )}
      </Box>

      <OrderList handleSubmit={handleSubmit} />

      <Dialog
        open={showModal}
        onClose={null}
        PaperProps={{
          style: {
            borderRadius: '15px',
            padding: '30px',
            backgroundColor: '#f7f9fc',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }} variant="h4">🎉 Вітаємо!</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ textAlign: 'center', fontSize: '1.3rem', color: '#333' }}>
            Ваше замовлення успішно сформоване.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <ProductBuyButton text="На головну" onClick={handleCloseModal} />
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OrderForm;
