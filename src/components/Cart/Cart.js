"use client";
import { useContext  } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'
import { Drawer, List, ListItem, IconButton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { CartContext } from '../../context/CartContext';
import ProductCounter from '../ProductPage/counter/productCounter';
import ProductBuyButton from '../Buttons/ProductBuy/ProductBuy';

import styles from './styles.module.css';

const StyledBadge = styled(Badge)(() => ({
  '& .MuiBadge-badge': {
    right: 2,
    top: 4,
    backgroundColor: '#000'
  },
}));

const CartDrawler = () => {
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

  const getItemPrice = (item) => {
    if (item?.quantity > 1) {
      return parseFloat((Number(item.price) * item.quantity).toFixed(2));
    }

    return item.price;
  };

  const closeCart = () => setCartOpen(false);

  const handleBuyClick = () => {
    closeCart();
    router.push('/order');
  };

  return (
    <>
      <IconButton
        aria-label="cart"
        onClick={() => setCartOpen(true)}
        className={styles.cartButton}
      >
        <StyledBadge
          badgeContent={itemsLength}
          color="primary"
          invisible={Boolean(!itemsLength)}
          className={styles.badge}
        >
          <LocalMallOutlinedIcon className={styles.cartIcon} />
        </StyledBadge>
      </IconButton>
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
                  const itemPrice = getItemPrice(item);

                  return (
                    <ListItem key={index} className={styles.cartListItem} divider>
                      <div className={styles.basketItemContainer}>
                        <div className={styles.basketImageContainer}>
                          <picture>
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className={styles.basketImage} />
                          </picture>
                        </div>
                        <div className={styles.itemDetails}>
                          <Link href={`/category/ring/${item.id}`}>
                            <h4 className={styles.itemTitle}>{item.title}</h4>
                          </Link>
                          {itemSize && (
                            <div>
                              <span>Розмір: {itemSize}</span>
                            </div>
                          )}
                          <div className={styles.counterWrapper}>
                            <ProductCounter initialCount={item.quantity} maxCount={10} cartItem={item} />
                          </div>
                          <div className={styles.price}>{`${itemPrice} грн`}</div>
                        </div>
                        <div className={styles.deleteContainer}>
                          <IconButton className={styles.deleteItem} onClick={() => removeFromCart(item.id)}>
                            <DeleteOutlineOutlinedIcon />
                          </IconButton>
                        </div>
                      </div>
                    </ListItem>
                  )
                })}
            </List>
            <div className={styles.buttonContainer}>
              <ProductBuyButton text={buyButtonText} onClick={handleBuyClick} width="85%" />
            </div></> : <Typography variant="h3" className={styles.emptyCartMessage}>Кошик порожній</Typography>}
          </>
      </Drawer>
    </>
  );
};

export default CartDrawler;
