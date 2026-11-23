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

import { getOrderCopy } from './copy';
import styles from './styles.module.css';

const OrderForm = ({ lang = 'uk' }) => {
  const t = getOrderCopy(lang);
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

    if (!firstName) errors.firstName = t.errors.firstName;
    if (!lastName) errors.lastName = t.errors.lastName;
    if (!email) {
      errors.email = t.errors.email;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t.errors.emailInvalid;
    }
    if (!rawPhone) {
      errors.phone = t.errors.phone;
    } else if (!/^[0-9]{12}$/.test(rawPhone)) {
      errors.phone = t.errors.phoneInvalid;
    }
    if (!cityName) errors.cityName = t.errors.cityName;
    if (!department) errors.department = t.errors.department;

    if (!contact) errors.contact = t.errors.contact;
  
    if (!payment) errors.payment = t.errors.payment;

    if (formData.isGift) {
      const { giftFirstName, giftLastName, giftEmail, giftPhone } = formData;
      const rawGiftPhone = (giftPhone || '').replace(/\D/g, '');

      if (!giftFirstName) errors.giftFirstName = t.errors.giftFirstName;
      if (!giftLastName) errors.giftLastName = t.errors.giftLastName;
      if (!rawGiftPhone) {
        errors.giftPhone = t.errors.giftPhone;
      } else if (!/^[0-9]{12}$/.test(rawGiftPhone)) {
        errors.giftPhone = t.errors.phoneInvalid;
      }
      if (giftEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(giftEmail)) {
        errors.giftEmail = t.errors.emailInvalid;
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

      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers,
        body
      });

      if (emailRes.ok) {
        handleOrderSuccess();
      } else {
        console.error('Failed to send order email', await emailRes.json().catch(() => ({})));
        setStatusMessage(t.submitFailed);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      setStatusMessage(t.submitFailed);
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
            <Typography className={styles.formTitle} variant="h4">{t.personalData}</Typography>
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label={t.firstName}
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
              label={t.lastName}
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
                  label={t.phone}
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
                label={t.phone}
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
              label={t.isGift}
            />
          </Grid>

          {formData.isGift && (
            <>
              <Grid item xs={12}>
                <Typography className={styles.formTitle} variant="h4">{t.giftRecipient}</Typography>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label={t.firstName}
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
                  label={t.lastName}
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
                  label={t.phone}
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
            <Typography className={styles.formTitle} variant="h4">{t.novaPoshta}</Typography>
          </Grid>

          <Grid item xs={12}>
            <CitySelect label={t.city} handleChange={handleChange} error={!!formErrors.cityName} helperText={formErrors.cityName} />
          </Grid>

          {formData.cityName && (
            <Grid item xs={12}>
              <DepartmentAutocomplete label={t.department} handleChange={handleChange} cityName={formData.cityName} error={!!formErrors.department} helperText={formErrors.department} />
            </Grid>
          )}
        </Grid>

        <Grid container spacing={2} className={styles.formGrid}>
            <Grid item xs={12}>
              <Typography className={styles.formTitle} variant="h4">{t.payment}</Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel error={!!formErrors.payment} id="paymentLabel">{t.payment}</InputLabel>
                <Select
                  labelId="paymentLabel"
                  id="payment"
                  value={formData.payment}
                  label={t.payment}
                  name="payment"
                  onChange={handleChange}
                  required
                  fullWidth
                  className={styles.contactSelect}
                >
                  <MenuItem value='liqPay'>{t.payCard}</MenuItem>
                  <MenuItem value='deliveryPay'>{t.payCod}</MenuItem>
                </Select>
                {formErrors.payment && (
                  <FormHelperText id="component-helper-text" error={true}>
                    {formErrors.payment}
                  </FormHelperText>
                )}
                {formData.payment === 'deliveryPay' && (
                  <FormHelperText>{t.codHint}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography className={styles.formTitle} variant="h4">{t.contactTitle}</Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel error={!!formErrors.contact} id="contactLabel">{t.contact}</InputLabel>
              <Select
                labelId="contactLabel"
                id="contact"
                value={formData.contact}
                label={t.contact}
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
              label={t.comments}
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
        t={t}
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
