"use client";
import { useContext  } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'
import { Drawer, List, ListItem, IconButton, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { CartContext } from '../../context/CartContext';
//import ProductCounter from '../ProductPage/counter/productCounter';
import ProductBuyButton from '../Buttons/ProductBuy/ProductBuy';
import RemainingPriceProgressBar from '../Form/Order/RemainingProgressBar/RemainingProgressBar';
import { getLinePrices } from '../../helpers/productPricing';

import styles from './styles.module.css';

const CART_LABEL = { uk: 'Кошик', ru: 'Корзина' };

const CartDrawler = ({ lang = 'uk' } = {}) => {
  const cartLabel = CART_LABEL[lang] || CART_LABEL.uk;
  const router = useRouter();
  const {
    cartItems,
    removeFromCart,
    clearCart,
    cartOpen,
    setCartOpen,
    getTotalPrice,
    getItemSize
  } = useContext(CartContext);
  const totalPrice = getTotalPrice();
  const buyButtonText = `Замовити ${totalPrice.toFixed(2)} грн`;
  const itemsLength = cartItems.length;
  const PRICE_FOR_FREE_DELIVERY = 2500;
  const isFreeDelivery = totalPrice >= PRICE_FOR_FREE_DELIVERY;

  const getItemPrice = (item) => getLinePrices(item);

  const closeCart = () => setCartOpen(false);

  const removeItemFromCart = productId => {
    removeFromCart(productId);
  };

  const handleBuyClick = () => {
    closeCart();
    router.push('/order');
  };

  return (
    <>
      <button
        type="button"
        aria-label={`${cartLabel}, ${itemsLength}`}
        aria-haspopup="dialog"
        onClick={() => setCartOpen(true)}
        className={styles.cartButton}
      >
        <svg className={styles.cartIcon} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
          <path d="M5 8h14l-1 12H6L5 8z" />
          <path d="M9 8V6a3 3 0 016 0v2" />
        </svg>
        <span className={`${styles.cartCount} ${itemsLength ? styles.cartCountActive : ''}`} aria-hidden="true">
          {itemsLength}
        </span>
      </button>
      <Drawer anchor="right" open={cartOpen} onClose={closeCart} className={styles.drawerEl}>
          <>
            <div className={styles.cartTitleContainer}>
              <Typography variant="h4">Кошик</Typography>
              <IconButton className={styles.closeCart} onClick={closeCart}>
                <CloseRoundedIcon />
              </IconButton>
            </div>
            {cartItems?.length > 0 ? <>
              <List className={styles.cartList}>
                {cartItems.map((item, index) => {
                  const itemSize = getItemSize(item);
                  const { price: itemPrice, originalPrice, hasDiscount } = getItemPrice(item);

                  return (
                    <ListItem key={index} className={styles.cartListItem} divider>
                      <div className={styles.basketItemContainer}>
                        <div className={styles.basketImageContainer}>
                          <picture>
                            <img
                              src={item.images?.[0] || item.image_path}
                              alt={item.title}
                              className={styles.basketImage} />
                          </picture>
                          {/*
                          <div className={styles.counterWrapper}>
                            <ProductCounter initialCount={item.quantity} maxCount={10} cartItem={item} />
                          </div>
                          */}
                        </div>
                        <div className={styles.itemDetails}>
                            <h4 className={styles.itemTitle}>{item.title}</h4>
                          {itemSize && (
                            <div>
                              <span>Розмір: {itemSize}</span>
                            </div>
                          )}
                          <div className={styles.price}>
                            {hasDiscount ? (
                              <>
                                <span className={styles.oldPrice}>{`${originalPrice} грн`}</span>
                                <span className={styles.salePrice}>{`${itemPrice} грн`}</span>
                              </>
                            ) : (
                              `${itemPrice} грн`
                            )}
                          </div>
                        </div>
                        <div className={styles.deleteContainer}>
                          <IconButton
                            className={styles.deleteItem}
                            onClick={() => removeFromCart(item.product_id)}
                          >
                            <DeleteOutlineOutlinedIcon />
                          </IconButton>
                        </div>
                      </div>
                    </ListItem>
                  )
                })}
            </List>

            <div className={styles.buttonContainer}>
              <div className={styles.freeDeliveryHint}>
                <RemainingPriceProgressBar price={totalPrice} maxPrice={PRICE_FOR_FREE_DELIVERY} />
              </div>
              <div className={styles.deliveryCtn}>
                <span>Доставка</span>
                <div className={`${styles.deliveryPrice} ${isFreeDelivery ? styles.freeDeliveryPrice : ''}`}>
                  <span className={`${styles.deliveryTax} ${isFreeDelivery ? styles.freeDeliveryOldText : ''}`}>
                    {`За тарифами 'Нової Пошти' - від 70 грн`}
                  </span>
                  {isFreeDelivery && <span>Безкоштовна доставка</span>}
                </div>
              </div>

              <ProductBuyButton text={buyButtonText} onClick={handleBuyClick} width="100%" />
            </div></> : <Typography variant="h3" className={styles.emptyCartMessage}>Кошик порожній</Typography>}
          </>
      </Drawer>
    </>
  );
};

export default CartDrawler;
