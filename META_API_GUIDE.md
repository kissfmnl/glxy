# Meta WhatsApp Cloud API — Koppelen aan KISS FM Portaal

Deze handleiding legt uit hoe je het portaal koppelt aan de officiële Meta WhatsApp Cloud API. Alles in de code (webhook, database, inbox) is hier technisch al op voorbereid.

## 1. Meta Developer App instellen
1.  Ga naar [Meta for Developers](https://developers.facebook.com/) en maak een account aan.
2.  Maak een nieuwe App aan (Type: **Business**).
3.  Voeg het product **WhatsApp** toe aan je app.
4.  Koppel een (test) telefoonnummer aan je account om te beginnen.

## 2. Webhook Verificatie
Het portaal heeft een actieve webhook endpoint op: `/api/webhook/whatsapp`

1.  Ga in het Meta Dashboard naar **WhatsApp > Configuration**.
2.  Klik op **Edit** bij Webhooks.
3.  **Callback URL**: Vul hier de URL van je portaal in (bijv. `https://jouw-portaal.railway.app/api/webhook/whatsapp`).
4.  **Verify Token**: Gebruik het token dat in je `.env` bestand staat (standaard: `KISSFM_VERIFY_TOKEN_2026`).
5.  Klik op **Verify and Save**.

## 3. Webhook Fields (Belangrijk!)
Nadat de koppeling geverifieerd is, moet je op **Manage** klikken bij Webhooks en de volgende velden 'Subscriben':
- `messages` (voor het ontvangen van tekst en audio)
- `message_echoes` (optioneel, als je ook eigen verzonden berichten wilt zien)

## 4. Environment Variables (.env)
Zorg dat de volgende gegevens in je hosting (bijv. Railway) zijn ingevuld:

```env
# Deze kies je zelf en moet overeenkomen met Meta Dashboard
WHATSAPP_VERIFY_TOKEN="KISSFM_VERIFY_TOKEN_2026"

# Je eigen toegangs-sleutel van Meta
WHATSAPP_API_TOKEN="EAA..."

# Te vinden in Meta Dashboard
WHATSAPP_PHONE_NUMBER_ID="1234567890"
```

---

**Status: Beta**
*De koppeling is volledig geïmplementeerd en getest met mockdata. Voor live gebruik hoef je enkel bovenstaande stappen in het Meta Dashboard te doorlopen.*
