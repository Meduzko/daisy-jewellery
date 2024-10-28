"use client";
import { useContext  } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'
import { Drawer, List, ListItem, IconButton, Typography } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { CartContext } from '../../context/CartContext';
import ProductCounter from '../ProductPage/counter/productCounter';
import ProductBuyButton from '../Buttons/ProductBuy/ProductBuy';

import styles from './styles.module.css';

const BasketDrawer = () => {
  const router = useRouter();
  const { cartItems, removeFromCart, clearCart, cartOpen, setCartOpen, getTotalPrice } = useContext(CartContext);
  const totalPrice = getTotalPrice();
  const buyButtonText = `Замовити ${totalPrice.toFixed(2)} ₴`;

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
      <IconButton onClick={() => setCartOpen(true)}>
        <ShoppingCartIcon />
      </IconButton>
      <Drawer anchor="right" open={cartOpen} onClose={closeCart} className={styles.drawerEl}>
        {cartItems?.length > 0 ? 
          <>
            <div className={styles.cartTitleContainer}>
              <Typography variant="h4">Кошик</Typography>
              <IconButton className={styles.closeCart} onClick={closeCart}>
                <CloseRoundedIcon />
              </IconButton>
            </div>
            <List className={styles.cartList}>
              {cartItems.map((item, index) => (
                <ListItem key={index} className={styles.cartListItem} divider>
                  <div className={styles.basketItemContainer}>
                    <div className={styles.basketImageContainer}>
                    <picture>
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className={styles.basketImage}
                      />
                    </picture>
                    </div>
                    <div className={styles.itemDetails}>
                      {/* <h4 className={styles.itemTitle}>{item.title}</h4> */}
                      <Link href={`/category/ring/${item.id}`}>
                        <h4 className={styles.itemTitle}>{item.title}</h4>
                      </Link>
                      <div className={styles.counterWrapper}>
                        <ProductCounter initialCount={item.quantity} maxCount={10} cartItem={item} />
                      </div>
                      <div className={styles.price}>{`${getItemPrice(item)} ₴`}</div>
                      {/* <div>{item.quantity}</div> */}
                    </div>
                    <div className={styles.deleteContainer}>
                      <IconButton className={styles.deleteItem} onClick={() => removeFromCart(item.id)}>
                        <DeleteOutlineOutlinedIcon />
                      </IconButton>
                    </div>
                    {/* <div className={styles.price}>{`${getItemPrice(item)} ₴`}</div> */}
                  </div>
                  {/* <IconButton onClick={() => removeItemFromBasket(item.id)}>Remove</IconButton> */}
                </ListItem>
              ))}
            </List>
            <div className={styles.buttonContainer}>
              <ProductBuyButton text={buyButtonText} onClick={handleBuyClick} width="85%" />
            </div>
          </> : <Typography variant="h3" className={styles.emptyCartMessage}>Кошик порожній</Typography>}
      </Drawer>
    </>
  );
};

export default BasketDrawer;
