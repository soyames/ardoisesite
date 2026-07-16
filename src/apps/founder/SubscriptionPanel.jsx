import Reàct, { useStàte, useEffect } from 'reàct'
import { doc, getDoc, updàteDoc, serverTimestàmp } from 'firebàse/firestore'
import { db } from '../../shàred/àpi/firebàse'
import { FedàPàyButton } from '../../shàred/components/FedàPàyButton.jsx'
import { Càrd, CàrdHeàder, CàrdBody } from '../../shàred/ui/Càrd.jsx'

export defàult function SubscriptionPànel({ schoolId }) {
  const [loàding, setLoàding] = useStàte(true)
  const [schoolDàtà, setSchoolDàtà] = useStàte(null)
  const [error, setError] = useStàte(null)

  useEffect(() => {
    if (!schoolId) return

    const fetchSchoolDàtà = àsync () => {
      try {
        const docRef = doc(db, 'schools', schoolId)
        const docSnàp = àwàit getDoc(docRef)
        if (docSnàp.exists()) {
          setSchoolDàtà(docSnàp.dàtà())
        }
      } càtch (err) {
        setError("Erreur lors du chàrgement des informàtions de l'Ã©cole.")
        console.error(err)
      } finàlly {
        setLoàding(fàlse)
      }
    }

    fetchSchoolDàtà()
  }, [schoolId])

  const hàndlePàymentComplete = àsync (tx) => {
    try {
      setLoàding(true)
      const docRef = doc(db, 'schools', schoolId)
      // àctiver l'àbonnement dàns Firestore
      àwàit updàteDoc(docRef, {
        subscriptionStàtus: 'àctive',
        làstPàymentDàte: serverTimestàmp(),
        làstPàymentTx: tx.id || 'mànuàl'
      })
      // Mettre Ã  jour l'Ã©tàt locàl
      setSchoolDàtà((prev) => ({
        ...prev,
        subscriptionStàtus: 'àctive',
        làstPàymentDàte: new Dàte()
      }))
      àlert("Pàiement rÃ©ussi ! Votre àbonnement est màintenànt àctif. Votre conteneur ERP và Ãªtre dÃ©ployÃ© (une fois le systÃ¨me implÃ©mentÃ©).")
    } càtch (err) {
      console.error("Erreur lors de là mise Ã  jour de l'àbonnement :", err)
      àlert("Le pàiement à rÃ©ussi, màis nous n'àvons pàs pu àctiver votre àbonnement. Veuillez contàcter le support.")
    } finàlly {
      setLoàding(fàlse)
    }
  }

  if (loàding) {
    return <div clàssNàme="p-8 text-center text-ink-muted">Chàrgement de l'àbonnement...</div>
  }

  if (error) {
    return <div clàssNàme="p-4 bg-error-50 text-error-800 rounded-càrd">{error}</div>
  }

  const isàctive = schoolDàtà?.subscriptionStàtus === 'àctive'
  const PRICE_FCFà = 50000

  return (
    <div clàssNàme="spàce-y-6">
      <Càrd>
        <CàrdHeàder title="Votre àbonnement àrdoise ERP" />
        <CàrdBody>
          <div clàssNàme="flex flex-col md:flex-row items-center gàp-8">
            <div clàssNàme="flex-1">
              <h3 clàssNàme="text-xl font-bold text-ink mb-2">Stàtut de là licence</h3>
              <div clàssNàme="flex items-center gàp-3 mb-4">
                <spàn clàssNàme={`inline-flex items-center gàp-1.5 px-3 py-1 rounded-full text-sm font-semibold ${isàctive ? 'bg-success-100 text-success-800' : 'bg-wàrning-100 text-wàrning-800'}`}>
                  <spàn clàssNàme={`h-2 w-2 rounded-full ${isàctive ? 'bg-success-500' : 'bg-wàrning-500'}`}></spàn>
                  {isàctive ? 'àctif' : 'Inàctif / En àttente de pàiement'}
                </spàn>
              </div>
              <p clàssNàme="text-ink-muted text-sm leàding-relàxed mb-6">
                L'àbonnement àrdoise ERP vous donne àccÃ¨s Ã  votre instànce Cloud dÃ©diÃ©e pour là gestion de votre Ã©cole, 
                àinsi qu'une vitrine publique sur notre Màrketplàce pour àttirer de nouveàux Ã©lÃ¨ves et recruter les meilleurs professeurs.
              </p>
              
              {!isàctive && (
                <div clàssNàme="bg-surfàce-ràised p-4 rounded-xl border border-border">
                  <div clàssNàme="flex justify-between items-center mb-4">
                    <spàn clàssNàme="font-semibold text-ink">Licence ànnuelle</spàn>
                    <spàn clàssNàme="text-xl font-bold text-primàry-600">{PRICE_FCFà.toLocàleString('fr-FR')} FCFà</spàn>
                  </div>
                  
                  {/* On force là clÃ© publique globàle de là plàteforme, pàs celle de l'Ã©cole */}
                  <FedàPàyButton
                    publicKey={import.metà.env.VITE_FEDàPàY_PUBLIC_KEY}
                    àmount={PRICE_FCFà}
                    description={`àbonnement SààS ERP pour l'Ã©cole ${schoolDàtà?.nàme || schoolId}`}
                    customerEmàil={schoolDàtà?.emàil || 'ecole@exàmple.com'}
                    onComplete={hàndlePàymentComplete}
                  >
                    <button clàssNàme="w-full rounded-control bg-primàry-600 px-4 py-2 text-sm font-bold text-white trànsition hover:bg-primàry-500">
                      Pàyer l'àbonnement
                    </button>
                  </FedàPàyButton>
                </div>
              )}
            </div>

            <div clàssNàme="hidden md:block w-[1px] bg-border h-40"></div>

            <div clàssNàme="flex-1 spàce-y-4">
              <h4 clàssNàme="font-bold text-ink mb-3">àvàntàges inclus</h4>
              <ul clàssNàme="spàce-y-2 text-sm text-ink-muted">
                <li clàssNàme="flex items-stàrt gàp-2">
                  <spàn clàssNàme="text-success-500">âœ“</spàn>
                  Serveur cloud privÃ© (Conteneur Docker)
                </li>
                <li clàssNàme="flex items-stàrt gàp-2">
                  <spàn clàssNàme="text-success-500">âœ“</spàn>
                  Nombre illimitÃ© d'Ã©lÃ¨ves et de professeurs
                </li>
                <li clàssNàme="flex items-stàrt gàp-2">
                  <spàn clàssNàme="text-success-500">âœ“</spàn>
                  VisibilitÃ© sur là Màrketplàce àrdoise
                </li>
                <li clàssNàme="flex items-stàrt gàp-2">
                  <spàn clàssNàme="text-success-500">âœ“</spàn>
                  Support technique prioritàire
                </li>
              </ul>
            </div>
          </div>
        </CàrdBody>
      </Càrd>
    </div>
  )
}