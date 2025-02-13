"use client";

import React, { useState, useContext } from 'react';
// import InputMask from "react-input-mask";
import {
  Box,
  Grid,
  TextField,
  Typography,
  InputLabel,
  MenuItem,
  FormControl,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import Select from '@mui/material/Select'
import { CartContext } from '../../../context/CartContext';
import DepartmentAutocomplete from './DepartmentAutocomplete/DepartmentAutocomplete';
import CitySelect from './CitySelect/CitySelect';
import OrderList from './OrderList/OrderList';

import styles from './styles.module.css';

const OrderForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cityName: '',
    department: '',
    contact: '',
    payment: ''
  });

  const [statusMessage, setStatusMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [loading, setLoading] = useState(false);
  const { cartItems, getTotalPrice, getItemSize, handleOrderSuccess } = useContext(CartContext);
  const orderDescription = `Оплата товару через веб-сайт: ${formData.firstName} ${formData.lastName} ${formData.email} ${formData.department} ${formData.cityName}`;

  const handleChange = (e, newName, newVal) => {
    const { name, value } = e.target;
    const validName = typeof newName === "string" ? newName : name;
    const n = validName || name;
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
    const totalPrice = getTotalPrice();
    const cartItemsWithSize = cartItems.map(item => {
      const size = getItemSize(item);

      if (size) {
        return {
          ...item,
          size
        }
      }

      return item;
    });

    return {
      formData,
      cartItems: cartItemsWithSize,
      totalPrice
    };
  };

  const validateForm = () => {
    const errors = {};
    const { firstName, lastName, email, phone, cityName, department, contact, payment } = formData;
    const rawPhone = phone.replace(/\D/g, '');

    if (!firstName) errors.firstName = 'Ім\'я є обов\'язковим полем';
    if (!lastName) errors.lastName = 'Прізвище є обов\'язковим полем';
    if (!email) {
      errors.email = 'Email є обов\'язковим полем';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Введіть валідну Email адресу';
    }
    if (!rawPhone) {
      errors.phone = 'Телефон є обов\'язковим полем';
    } else if (!/^[0-9]{12}$/.test(rawPhone)) {
      errors.phone = 'Введіть валідний номер телефону у форматі: 380 (##)-##-###-## (12 цифр)';
    }
    if (!cityName) errors.cityName = 'Населений пункт є обов\'язковим полем';
    if (!department) errors.department = 'Відділення є обов\'язковим полем';

    if (!contact) errors.contact = 'Спосіб зв\'язку є обов\'язковим полем';
  
    if (!payment) errors.payment = 'Метод оплати є обов\'язковим полем';

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return false;
    }

    return true;
  };

  const sendOrderEmail = async (paidInfo) => {
    try {
      setLoading(true);

      const orderData = getOrderData();
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...orderData, paidInfo }),
      });

      const result = await res.json();
      if (res.status === 200) {
        handleOrderSuccess();
      } else {
        setStatusMessage('Error' );
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setStatusMessage('Failed to submit order.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e, paidInfo = {}) => {
    e?.preventDefault();
    setTouchedFields({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      cityName: true,
      department: true,
      contact: true,
      payment: true
    });

    if (!validateForm()) {
      return;
    }

    sendOrderEmail(paidInfo);
  };

  const triggerValidation = (e) => {
    e?.preventDefault();
    setTouchedFields({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      cityName: true,
      department: true,
      contact: true,
      payment: true
    });

    if (!validateForm()) {
      return;
    }
  };

  return (
    <>
      {loading && (
        <div className={styles.preloader}>
          <CircularProgress />
        </div>
      )}
      <div className={`${styles.defaultBlured}${loading ? styles.blurred : ''}`} />
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
            {/* <InputMask
              mask="+380 (99)-99-999-99"
              value={formData.phone}
              onChange={handleChange}
            >
              {() => (
                <TextField
                  fullWidth
                  label="Телефон"
                  name="phone"
                  // value={formData.phone}
                  // onChange={handleChange}
                  required
                  error={!!formErrors.phone}
                  helperText={formErrors.phone}
                />
              )}
            </InputMask> */}
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

        <Grid container spacing={2} className={styles.formGrid}>
          <Grid item xs={12}>
            <Typography className={styles.formTitle} variant="h4">Відділення Нової Пошти</Typography>
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

        <Grid container spacing={2} className={styles.formGrid}>
            <Grid item xs={12}>
              <Typography className={styles.formTitle} variant="h4">Оплата</Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel error={!!formErrors.payment} id="paymentLabel">Оплата</InputLabel>
                <Select
                  labelId="paymentLabel"
                  id="payment"
                  value={formData.payment}
                  label="Оплата"
                  name="payment"
                  onChange={handleChange}
                  required
                  fullWidth
                  className={styles.contactSelect}
                >
                  <MenuItem value='liqPay'>Банківська картка (LiqPay)</MenuItem>
                  <MenuItem value='deliveryPay'>Оплата при доставці</MenuItem>
                </Select>
                {formErrors.payment && (
                  <FormHelperText id="component-helper-text" error={true}>
                    {formErrors.payment}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography className={styles.formTitle} variant="h4">{`Як з вами зв'язатися?`}</Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel error={!!formErrors.contact} id="contactLabel">{`Спосіб зв'язку`}</InputLabel>
              <Select
                labelId="contactLabel"
                id="contact"
                value={formData.contact}
                label="Спосіб зв'язку"
                name="contact"
                onChange={handleChange}
                required
                fullWidth
                className={styles.contactSelect}
              >
                <MenuItem value={'Telegram'}>Telegram</MenuItem>
                <MenuItem value={'Viber'}>Viber</MenuItem>
                <MenuItem value={'WatsUp'}>WatsUp</MenuItem>
              </Select>
              {formErrors.contact && (
                <FormHelperText id="component-helper-text" error={true}>
                  {formErrors.contact}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              id="comments"
              label="Коментар"
              name="comments"
              multiline
              maxRows={16}
              value={formData.comments}
              onChange={handleChange}
              fullWidth
              className={styles.commentsTextArea}
          />
          </Grid>
        </Grid>

        {/* Status Message */}
        {statusMessage && (
          <Typography variant="body1" color="error" sx={{ mt: 2 }}>
            {statusMessage}
          </Typography>
        )}
      </Box>

      <OrderList
        handleSubmit={handleSubmit}
        orderDescription={orderDescription}
        triggerValidation={triggerValidation}
        validateForm={validateForm}
        formData={formData}
      />
    </>
  );
};

export default OrderForm;
