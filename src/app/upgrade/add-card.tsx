import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Field, Header, Screen, ToggleRow } from '@/components/ui';
import { setPaymentMethod } from '@/services/api';
import { useCheckout } from '@/store/checkout';
import { useApp } from '@/store/useApp';

const luhn = (num: string) => {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = +num[i];
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return num.length >= 13 && sum % 10 === 0;
};
const brandOf = (n: string) => (/^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'Amex' : 'Card');

export default function AddCard() {
  const { update } = useLocalSearchParams<{ update?: string }>();
  const [number, setNumber] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('United Arab Emirates');
  const [save, setSave] = useState(true);
  const [touched, setTouched] = useState(false);

  const digits = number.replace(/\D/g, '');
  const [mm, yy] = exp.split('/').map((x) => x.trim());
  const expDate = mm && yy ? new Date(2000 + +yy, +mm, 0, 23, 59) : null;
  const errors = {
    number: !luhn(digits) ? 'Enter a valid card number.' : '',
    exp: !expDate || +mm < 1 || +mm > 12 ? 'Use MM / YY.' : expDate < new Date() ? 'This card has expired.' : '',
    cvv: brandOf(digits) === 'Amex' ? (cvv.length !== 4 ? 'CVV should be 4 digits.' : '') : cvv.length !== 3 ? 'CVV should be 3 digits.' : '',
    name: name.trim().length < 2 ? 'Enter the name on the card.' : '',
    country: !country.trim() ? 'Enter your billing country.' : '',
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (k: keyof typeof errors) => (touched ? errors[k] || undefined : undefined);

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    const brand = brandOf(digits);
    const last4 = digits.slice(-4);
    const label = `${brand} •••• ${last4}`;
    if (save) {
      const st = useApp.getState();
      st.set({ cards: [...st.cards.filter((c) => c.last4 !== last4), { id: Date.now().toString(), brand, last4, exp: `${mm}/${yy}`, name: name.trim() }] });
    }
    useCheckout.getState().set({ method: label });
    if (update) {
      useApp.getState().set({ paymentMethod: label });
      setPaymentMethod(label).catch(() => {});
      router.dismissTo('/subscription');
    } else router.replace('/upgrade/review');
  };

  return (
    <Screen scroll footer={<Button title="Continue" onPress={submit} />}>
      <Header title="Add card" />
      <Field
        label="Card number"
        value={number}
        onChangeText={(t) => setNumber(t.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 '))}
        placeholder="1234 5678 9012 3456"
        keyboardType="number-pad"
        autoComplete="cc-number"
        textContentType="creditCardNumber"
        error={show('number')}
      />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field
            label="Expiry date"
            value={exp}
            onChangeText={(t) => {
              const d = t.replace(/\D/g, '').slice(0, 4);
              setExp(d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d);
            }}
            placeholder="MM / YY"
            keyboardType="number-pad"
            autoComplete="cc-exp"
            error={show('exp')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="CVV" value={cvv} onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))} placeholder="•••" keyboardType="number-pad" secureTextEntry autoComplete="cc-csc" error={show('cvv')} />
        </View>
      </View>
      <Field label="Cardholder name" value={name} onChangeText={setName} placeholder="Name on card" autoComplete="cc-name" autoCapitalize="words" error={show('name')} />
      <Field label="Billing country" value={country} onChangeText={setCountry} placeholder="Country" error={show('country')} />
      <Card style={{ paddingVertical: 4 }}>
        <ToggleRow label="Save this card for future purchases" value={save} onChange={setSave} />
      </Card>
    </Screen>
  );
}
