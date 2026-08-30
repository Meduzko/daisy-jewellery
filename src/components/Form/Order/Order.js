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
  FormHelperText,
  Checkbox,
  FormControlLabel
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
    payment: '',
    isGift: false,
    giftFirstName: '',
    giftLastName: '',
    giftEmail: '',
    giftPhone: ''
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

  const handleGiftToggle = (e) => {
    const { checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      isGift: checked,
    }));

    if (!checked) {
      setFormErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors };
        delete updatedErrors.giftFirstName;
        delete updatedErrors.giftLastName;
        delete updatedErrors.giftEmail;
        delete updatedErrors.giftPhone;
        return updatedErrors;
      });
    }
  };

  const getOrderData = () => {
    const totalPrice = getTotalPrice();
    const cartItemsWithSize = cartItems.map(item => {
      const { prices, ...itemWithoutPrices } = item;
      const size = getItemSize(item);

      if (size) {
        return {
          ...itemWithoutPrices,
          size
        }
      }

      return itemWithoutPrices;
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

    if (formData.isGift) {
      const { giftFirstName, giftLastName, giftEmail, giftPhone } = formData;
      const rawGiftPhone = (giftPhone || '').replace(/\D/g, '');

      if (!giftFirstName) errors.giftFirstName = 'Ім\'я одержувача є обов\'язковим полем';
      if (!giftLastName) errors.giftLastName = 'Прізвище одержувача є обов\'язковим полем';
      if (!rawGiftPhone) {
        errors.giftPhone = 'Телефон одержувача є обов\'язковим полем';
      } else if (!/^[0-9]{12}$/.test(rawGiftPhone)) {
        errors.giftPhone = 'Введіть валідний номер телефону у форматі: 380 (##)-##-###-## (12 цифр)';
      }
      if (giftEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(giftEmail)) {
        errors.giftEmail = 'Введіть валідну Email адресу';
      }
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return false;
    }

    return true;
  };

  const submitOrder = async (paidInfo) => {
    try {
      setLoading(true);

      const orderData = getOrderData();
      const body = JSON.stringify({ ...orderData, paidInfo });
      const headers = { 'Content-Type': 'application/json' };

      const [orderRes, emailRes] = await Promise.all([
        fetch('/api/order', {
          method: 'POST',
          headers,
          body
        }),
        fetch('/api/send-email', {
          method: 'POST',
          headers,
          body
        })
      ]);

      if (orderRes.ok || emailRes.ok) {
        handleOrderSuccess();
        if (!orderRes.ok) {
          console.error('Failed to create DNTrade order', await orderRes.json().catch(() => ({})));
        }
        if (!emailRes.ok) {
          console.error('Failed to send order email', await emailRes.json().catch(() => ({})));
        }
      } else {
        setStatusMessage('Не вдалося оформити замовлення. Спробуйте ще раз.');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      setStatusMessage('Не вдалося оформити замовлення. Спробуйте ще раз.');
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

    submitOrder(paidInfo);
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
      {loading && <div className={`${styles.defaultBlured} ${styles.blurred}`} />}
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
                type="tel"
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
            <FormControlLabel
              sx={{ userSelect: 'none' }}
              control={
                <Checkbox
                  checked={formData.isGift}
                  onChange={handleGiftToggle}
                  name="isGift"
                />
              }
              label="Оформити замовлення в подарунок"
            />
          </Grid>

          {formData.isGift && (
            <>
              <Grid item xs={12}>
                <Typography className={styles.formTitle} variant="h4">Дані одержувача подарунка</Typography>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Ім'я"
                  name="giftFirstName"
                  value={formData.giftFirstName}
                  onChange={handleChange}
                  required
                  error={!!formErrors.giftFirstName}
                  helperText={formErrors.giftFirstName}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Прізвище"
                  name="giftLastName"
                  value={formData.giftLastName}
                  onChange={handleChange}
                  required
                  error={!!formErrors.giftLastName}
                  helperText={formErrors.giftLastName}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="giftEmail"
                  type="email"
                  value={formData.giftEmail}
                  onChange={handleChange}
                  error={!!formErrors.giftEmail}
                  helperText={formErrors.giftEmail}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Телефон"
                  name="giftPhone"
                  type="tel"
                  value={formData.giftPhone}
                  onChange={handleChange}
                  required
                  error={!!formErrors.giftPhone}
                  helperText={formErrors.giftPhone}
                />
              </Grid>
            </>
          )}
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
        formErrors={formErrors}
      />
    </>
  );
};

export default OrderForm;
