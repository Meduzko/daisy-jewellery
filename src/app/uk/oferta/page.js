import { getDefaultMetaData } from '../../../helpers';
import styles from './styles.module.css';

export async function generateMetadata({ params }) {
  const metadata = getDefaultMetaData({ pagePath: 'oferta', title: 'Магазин срібних прикрас - Daisy Jewellery | Оферта' });

  return metadata;
}

export default function OfertaPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.mainTitle}>ПУБЛІЧНИЙ ДОГОВІР (ОФЕРТА) на замовлення, купівлю-продаж і доставку товарів </h1>
        <p>Цей договір є офіційною та публічною пропозицією Продавця укласти договір купівлі-продажу Товару,
          представленого на сайті <a className={styles.link} href='/'>https://daisy-jewellery.com.ua</a>. Даний договір є публічним, тобто відповідно до статті 633 Цивільного кодексу України,
          його умови є однаковими для всіх покупців незалежно від їх статусу (фізична особа, юридична особа, фізична особа-підприємець)
          без надання переваги одному покупцю перед іншим. Шляхом укладення цього Договору покупець в повному обсязі приймає умови та порядок оформлення замовлення,
          оплати товару, доставки товару, повернення товару, відповідальності за недобросовісне замовлення та усі інші умови договору.
          Договір вважається укладеним з моменту натискання кнопки «Підтвердити Замовлення» на сторінці оформлення замовлення в Розділі «Кошик» і отримання Покупцем
          від Продавця підтвердження замовлення в електронному вигляді.</p>
      </div>

      <div className={styles.container}>
        <h2>1. Визначення термінів</h2>
        <p> 1.1. Публічна оферта (далі - «Оферта») - публічна пропозиція Продавця, адресована невизначеному колу осіб, укласти з Продавцем договір купівлі-продажу товару дистанційним способом (далі - «Договір») на умовах, що містяться в цій Оферті. </p>
        <p>1.2. Товар або Послуга – об&apos;єкт угоди сторін, який був обраний покупцем на сайті Інтернет-магазину та поміщений у кошик, або вже придбаний Покупцем у Продавця дистанційним способом. </p>
        <p>1.2. Інтернет-магазин – сайт Продавця за адресою www.daisy-jewellery.com.ua створений для укладення договорів роздрібної та оптової купівлі-продажу на підставі ознайомлення Покупця із запропонованим Продавцем описом Товару за допомогою мережі Інтернет.</p>
        <p>1.3. Покупець – дієздатна фізична особа, яка досягла 18 років, отримує інформацію від Продавця, розміщує замовлення щодо купівлі товару, що представлений на сайті Інтернет-магазину для цілей, що не пов&apos;язані зі здійсненням підприємницької діяльності, або юридична особа чи фізична особа-підприємець.</p>
        <p>1.4. Продавець – Фізична особа-підприємець ФОП Грязіна Світлана Анатоліївна (ідентифікаційний код 2478302521), особа, яка створена і діє відповідно до чинного законодавства України, місцезнаходження якої: 34700, м. Корець, вул. Старомонастирська, буд. 5 </p>
      </div>

      <div className={styles.container}>
        <h2>2. Предмет Договору</h2>
        <p>2.1. Продавець зобов’язується передати у власність Покупцю Товар, а Покупець зобов’язується оплатити і прийняти Товар на умовах цього Договору.</p>
        <p>2.2. Датою укладення Договору-оферти (акцептом оферти) та моментом повного й беззаперечного прийняттям Покупцем умов Договору вважається дата заповнення Покупцем форми замовлення, розташованої на сайті Інтернет-магазину, за умови отримання Покупцем від Продавця підтвердження замовлення в електронному вигляді. У разі необхідності, за бажанням Покупця, Договір може бути оформлений у письмовій формі.</p> 
      </div>

      <div className={styles.container}>
        <h2>3. Оформлення Замовлення</h2>
        <p>3.1. Покупець самостійно оформлює замовлення в Інтернет-магазину через форму «Кошика», або зробивши замовлення електронною поштою чи за номером телефону, вказаним в розділі контактів Інтернет-магазину.</p>
        <p>3.2. Продавець має право відмовитися від передання замовлення Покупцеві у випадку, якщо відомості, вказані Покупцем під час оформлення замовлення, є неповними або викликають підозру щодо їх дійсності.</p>

        <p>{`3.3. При оформленні замовлення на сайті Інтернет-магазину Покупець зобов'язується надати наступну обов’язкову інформацію, необхідну Продавцю для виконання замовлення:`}</p>

        <p>{`3.3.1. прізвище, ім'я Покупця;`}</p>

        <p>3.3.2. адреса, за якою слід доставити Товар (якщо доставка до адреси Покупця);</p>

        <p>3.3.3. контактний телефон.</p>

        <p>3.3.4. Ідентифікаційний код для юридичної особи або фізичної-особи підприємця.</p>

        <p>3.4. Найменування, кількість, артикул, ціна обраного Покупцем Товару вказуються в кошику Покупця на сайті Інтернет-магазину.</p>

        <p>3.5. Якщо будь-якої із Сторін договору необхідна додаткова інформація, він має право запросити її у іншій Стороні. У разі ненадання необхідної інформації Покупцем, Продавець не несе відповідальності за надання якісної послуги Покупцю при покупці товару в інтернет-магазині.</p>

        <p>{`3.6. При оформленні замовлення через оператора Продавця (п. 3.1. Цієї Оферти) Покупець зобов'язується надати інформацію, зазначену в п. 3.3 – 3.4. цієї Оферти.`}</p>

        <p>3.6. Ухвалення Покупцем умов цієї Оферти здійснюється за допомогою внесення Покупцем відповідних даних в реєстраційну форму на сайті Інтернет-магазину або при оформленні Замовлення через оператора. Після оформлення Замовлення через Оператора дані про Покупця вносяться до бази даних Продавця.</p>

        <p>3.7. Покупець несе відповідальність за достовірність наданої інформації при оформленні Замовлення.</p>

        <p>3.8. Укладаючи Договір, тобто акцептуючи умови даної пропозиції (запропоновані умови придбання Товару), шляхом оформлення Замовлення, Покупець підтверджує наступне:</p>

        <p>{`а) Покупець цілком і повністю ознайомлений, і згоден з умовами цієї пропозиції (оферти);`}</p>

        <p>{`б) він дає дозвіл на збір, обробку та передачу персональних даних, дозвіл на обробку персональних даних діє протягом усього терміну дії Договору, а також протягом необмеженого терміну після закінчення його дії. Крім цього, укладенням договору Покупець підтверджує, що він повідомлений (без додаткового повідомлення) про права, встановлених Законом України "Про захист персональних даних", про цілі збору даних, а також про те, що його персональні дані передаються Продавцю з метою можливості виконання умов цього Договору, можливості проведення взаєморозрахунків, а також для отримання рахунків, актів та інших документів. Покупець також погоджується з тим, що Продавець має право надавати доступ та передавати його персональні дані третім особам без будь-яких додаткових повідомлень Покупця з метою виконання замовлення Покупця. Обсяг прав Покупця, як суб'єкта персональних даних відповідно до Закону України "Про захист персональних даних" йому відомий і зрозумілий.`}</p>
      </div>

      <div className={styles.container}>
        <h2>4. Ціна і Доставка Товару</h2>
        <p>4.1 Ціни на Товари та послуги визначаються Продавцем самостійно та вказані на сайті Інтернет-магазину. Всі ціни на Товари та послуги вказані на сайті у гривнях з урахуванням ПДВ.</p>

        <p>{`4.2 Ціни на Товари та послуги можуть змінюватися Продавцем в односторонньому порядку залежно від кон'юнктури ринку. При цьому ціна окремої одиниці Товару, вартість якої оплачена Покупцем в повному обсязі, не може бути змінена Продавцем в односторонньому порядку.`}</p>

        <p>4.3. Вартість Товару, яка вказана на сайті Інтернет-магазину не включає в себе вартість доставки Товару Покупцю. Вартість доставки Товару Покупець сплачує відповідно до діючих тарифів служб доставки (перевізників) безпосередньо обраній ним службі доставки (перевізнику).</p>

        <p>4.4. Вартість Товару яка вказана на сайті Інтернет-магазину не включає в себе вартість доставки Товару на адресу Покупця.</p>

        <p>4.5. Продавець може вказати орієнтовну вартість доставки Товару на адресу Покупця під час звернення Покупця із відповідним запитом до Продавця шляхом надіслання листа на електронну пошту або при оформленні замовлення через оператора інтернет-магазину.</p>

        <p>{`4.6. Зобов'язання Покупця по оплаті Товару вважаються виконаними з моменту надходження Продавцю коштів на його рахунок.`}</p>

        <p>4.7. Розрахунки між Продавцем і Покупцем за Товар здійснюються способами, зазначеними на сайті Інтернет-магазину в розділі «Оплата і Доставка».</p>

        <p>4.8. При отриманні товару Покупець повинен у присутності представника служби доставки (перевізника) перевірити відповідність Товару якісним і кількісним характеристикам (найменування товару, кількість, комплектність, термін придатності).</p>

        <p>4.9. Покупець або його представник під час приймання Товару підтверджує своїм підписом в товарному чеку/ або в замовленні/ або в транспортній накладній на доставку товарів, що не має претензій до кількості товару, зовнішнім виглядом і комплектності товару.</p>

        <p>4.10. Право власності та ризик випадкової втрати або пошкодження Товару переходить до Покупця або його Представника з моменту отримання Товару Покупцем в місті поставки Товару при самостійній доставки Товару від Продавця, чи під час передачі Продавцем товару службі доставки (перевізнику) обраної Покупцем.</p>
      </div>

      <div className={styles.container}>
        <h2>5. Права ті обов’язки Сторін</h2>
        <p>5.1. Продавець зобов’язаний:</p>

        <p>5.1.1. Передати Покупцеві товар у відповідності до умов цього Договору та замовлення Покупця.</p>

        <p>5.1.2. Не розголошувати будь-яку приватну інформацію про Покупця і не надавати доступ до цієї інформації третім особам, за винятком випадків, передбачених законодавством та під час виконання Замовлення Покупця.</p>

        <p>5.2. Продавець має право:</p>

        <p>5.2.1. Змінювати умови цього Договору, а також ціни на Товари та послуги, в односторонньому порядку, розміщуючи їх на сайті Інтернет-магазину. Всі зміни набувають чинності з моменту їх публікації.</p>

        <p>{`5.3. Покупець зобов'язується:`}</p>

        <p>5.3.1. До моменту укладення Договору ознайомитися зі змістом Договору, умовами Договору і цінами, запропонованими Продавцем на сайті Інтернет-магазину.</p>

        <p>{`5.3.2. На виконання Продавцем своїх зобов'язань перед Покупцем останній повинен повідомити всі необхідні дані, що однозначно ідентифікують його як Покупця, і достатні для доставки Покупцеві замовленого Товару.`}</p>
      </div>

      <div className={styles.container}>
        <h2>6. Повернення Товару</h2>

        <p>6.1. Покупець має право на повернення Продавцеві непродовольчого товару належної якості, якщо товар не задовольнив його за формою, габаритами, фасоном, кольором, розміром або з інших причин не може бути ним використаний за призначенням. Покупець має право на повернення товару належної якості протягом 14 (чотирнадцяти) днів, не враховуючи дня купівлі. Повернення товару належної якості проводиться, якщо він не використовувався і якщо збережено його товарний вигляд, споживчі властивості, упаковка, пломби, ярлики, а також розрахунковий документ, виданий Покупцю за оплату Товару. Перелік товарів, що не підлягають поверненню на підставах, передбачених у цьому пункті, затверджується Кабінетом Міністрів України.</p>

        <p>6.2. Повернення Покупцеві вартості товару належної якості здійснюється протягом 30 (тридцяти) календарних днів з моменту отримання такого Товару Продавцем за умови дотримання вимог, передбачених п. 6.1. Договору, чинним законодавством України.</p>

        <p>6.3. Вартість товару підлягає поверненню шляхом банківського переказу на рахунок Покупця.</p>

        <p>6.4. Повернення Товару належної якості за адресою Продавця, здійснюється за рахунок Покупця та Продавцем Покупцеві не відшкодовується.</p>

        <p>{`6.5. У разі виявлення протягом встановленого гарантійного строку недоліків у Товарі, Покупець особисто, в порядку та у строки, що встановлені законодавством України, має право пред'явити Продавцеві вимоги, передбачені Законом України «Про захист прав споживачів». При пред’явленні вимог про безоплатне усунення недоліків, строк на їх усунення відраховується з дати отримання Товару Продавцем в своє розпорядження та фізичного доступу до такого Товару.`}</p>

        <p>6.6. Розгляд вимог, передбачених Законом України «Про захист прав споживачів», провадиться Продавцем за умови надання Покупцем документів, передбачених чинним законодавством України. Продавець не відповідає за недоліки Товару, які виникли після його передання Покупцеві внаслідок порушення Покупцем правил користування або зберігання Товару, дій третіх осіб або непереборної сили.</p>

        <p>6.7. Покупець не має права відмовитися від товару належної якості, що має індивідуально-визначені властивості, якщо зазначений товар може бути використаний виключно Покупцем, який його придбав, (в т.ч. за за бажанням Покупця не стандартні розміри, характеристики, зовнішній вигляд, комплектація та інше). Підтвердженням того, що товар має індивідуально-визначені властивості, є відмінність розмірів товару та інших характеристик, що вказані в інтернет-магазині.</p>

        <p>6.8. Повернення товару, у випадках, передбачених законом та цим Договором, здійснюється за адресою, вказаною на сайті в розділі «Контакти».</p>
      </div>

      <div className={styles.container}>
        <h2>7. Відповідальність</h2>

        <p>7.1. Продавець не несе відповідальності за шкоду, заподіяну Покупцеві або третім особам внаслідок неналежного монтажу, використання, зберігання Товару придбаного у Продавця.</p>

        <p>7.2. Продавець не несе відповідальності за неналежне, несвоєчасне виконання Замовлень і своїх зобов’язань у випадку надання Покупцем недостовірної або помилкової інформації.</p>

        <p>{`7.3. Продавець і Покупець несуть відповідальність за виконання своїх зобов'язань відповідно до чинного законодавства України і положень цього Договору.`}</p>

        <p>{`7.4. Продавець або Покупець звільняються від відповідальності за повне або часткове невиконання своїх зобов'язань, якщо невиконання є наслідком форс-мажорних обставин як: війна або військові дії, землетрус, повінь, пожежа та інші стихійні лиха, що виникли незалежно від волі Продавця і / або Покупця після укладення цього договору. Сторона, яка не може виконати свої зобов'язання, негайно повідомляє про це іншу Сторону.`}</p>
      </div>

      <div className={styles.container}>
        <h2>8. Конфіденційність і захист персональних даних.</h2>
        <p>8.1. Надаючи свої персональні дані на сайті Інтернет-магазину при реєстрації або оформленні Замовлення, Покупець надає Продавцеві свою добровільну згоду на обробку, використання (у тому числі і передачу) своїх персональних даних, а також вчинення інших дій, передбачених Законом України «Про захист персональних даних», без обмеження терміну дії такої згоди.</p>

        <p>{`8.2. Продавець зобов'язується не розголошувати отриману від Покупця інформацію. Не вважається порушенням надання Продавцем інформації контрагентам і третім особам, що діють на підставі договору з Продавцем, в тому числі і для виконання зобов'язань перед Покупцем, а також у випадках, коли розкриття такої інформації встановлено вимогами чинного законодавства України.`}</p>

        <p>{`8.3. Покупець несе відповідальність за підтримання своїх персональних даних в актуальному стані. Продавець не несе відповідальності за неякісне виконання або невиконання своїх зобов'язань у зв'язку з неактуальністю інформації про Покупця або невідповідністю її дійсності.`}</p>
      </div>

      <div className={styles.container}>
        <h2>9. Інші умови</h2>

        <p>9.1. Цей договір укладено на території України і діє відповідно до чинного законодавства України.</p>

        <p>9.2. Усі спори, що виникають між Покупцем і Продавцем, вирішуються шляхом переговорів. У випадку недосягнення врегулювання спірного питання шляхом переговорів, Покупець та/або Продавець мають право звернутися за вирішенням спору до судових органів відповідно до чинного законодавства України.</p>

        <p>9.3. Продавець має право вносити зміни до цього Договору в односторонньому порядку, передбаченому п. 5.2.1. Договору. Крім того, зміни до Договору також можуть бути внесені за взаємною згодою Сторін в порядку, передбаченому чинним законодавством України.</p>
      </div>

      <div className={`${styles.container} ${styles.bottonContainer}`}>
        <h2>АДРЕСА ТА РЕКВІЗИТИ ПРОДАВЦЯ: </h2>
        <p><strong>ФОП Грязіна Світлана Анатоліївна</strong></p>
        <p>34700, м. Корець, вул. Старомонастирська, буд. 5</p>
        <p>Найменування р/р: ФОП Грязіна Світлана Анатоліївна</p>
        <p>IBAN: UA213052990000026007010701210</p>
        <p>МФО 305299</p>
        <p>ЄДРПОУ: 2478302521</p>
        <p>тел. +(380) 673540867</p>
      </div>
    </div>
  )
}
