
        /**
         * LOGIQUE FRONTEND MERCATO
         * Gestion de l'état, de l'affichage dynamique et de la validation
         */

        // 1. Données de configuration (Algorithme de validation)
        const NETWORKS = {
            'vodacom': { prefixes: ['081', '082', '083', '086'], name: 'Vodacom', color: 'border-red-500 text-red-500' }, // Prefixes standards RDC (adapté si besoin)
            'airtel': { prefixes: ['099', '097'], name: 'Airtel', color: 'border-red-600 text-red-600' },
            'orange': { prefixes: ['089', '084', '085'], name: 'Orange', color: 'border-orange-500 text-orange-500' },
            'africell': { prefixes: ['090', '080'], name: 'Africell', color: 'border-purple-600 text-purple-600' }
        };

        // Données d'offres factices pour simuler le backend
        const OFFERS_DB = {
            'vodacom': {
                'internet': [
                    { id: 'v_i_1', title: '200 MB', duration: '72h', price: '1000 FC', amount: 30 },
                    { id: 'v_i_2', title: '2.5 GB', duration: '48h', price: '2000 FC', amount: 120 }
                    //{ id: 'v_i_3', title: '5 GB', duration: '14 Jours', price: '4000 FC', amount: 4000 },
                    //{ id: 'v_i_4', title: '10 GB', duration: '30 Jours', price: '10000 FC', amount: 10000 }
                ],
                'credit': [
                    { id: 'v_c_1', title: 'Crédit 15 u', duration: 'Standard', price: '500 FC', amount: 15 }
                   // { id: 'v_c_2', title: 'Crédit 100 u', duration: 'Standard', price: '1000 FC', amount: 1000 },
                   // { id: 'v_c_3', title: 'Crédit 500 u', duration: 'Standard', price: '5000 FC', amount: 5000 }
                ]
            },
            'airtel': {
                'internet': [
                    { id: 'a_i_1', title: '1.2 GB', duration: '24h', price: '1000 FC', amount: 1000 },
                    { id: 'a_i_2', title: '3 GB', duration: '7 Jours', price: '2000 FC', amount: 2000 }
                ],
                'credit': [
                    { id: 'a_c_1', title: 'Crédit', duration: 'Standard', price: '1000 FC', amount: 1000 }
                ]
            },
            'orange': {
                'internet': [
                    { id: 'o_i_1', title: '1 GB', duration: '3 Jours', price: '1000 FC', amount: 1000 },
                    { id: 'o_i_2', title: '4 GB', duration: '7 Jours', price: '3000 FC', amount: 3000 }
                ],
                'credit': [
                    { id: 'o_c_1', title: 'Crédit', duration: 'Standard', price: '1000 FC', amount: 1000 }
                ]
            },
            'africell': {
                'internet': [
                    { id: 'af_i_1', title: '2 GB', duration: '24h', price: '1000 FC', amount: 1000 },
                    { id: 'af_i_2', title: '5 GB', duration: '7 Jours', price: '2000 FC', amount: 2000 }
                ],
                'credit': [
                    { id: 'af_c_1', title: 'Crédit', duration: 'Standard', price: '1000 FC', amount: 1000 }
                ]
            }
        };

        // État de l'application
        const state = {
            network: null,
            type: null,
            offer: null,
            phone: '',
            isValidPhone: false
        };

        // Éléments du DOM
        const networkBtns = document.querySelectorAll('.network-btn');
        const typeBtns = document.querySelectorAll('.type-btn');
        const step2Container = document.getElementById('step2-type');
        const step3Loader = document.getElementById('step3-loader');
        const step4Container = document.getElementById('step4-offers');
        const step5Container = document.getElementById('step5-checkout');
        const offersGrid = document.getElementById('offers-grid');
        const networkBadge = document.getElementById('selected-network-badge');
        
        const summaryTitle = document.getElementById('summary-title');
        const summaryPrice = document.getElementById('summary-price');
        const phoneInput = document.getElementById('phone');
        const phoneCheckIcon = document.getElementById('phone-check-icon');
        const phoneErrorIcon = document.getElementById('phone-error-icon');
        const phoneFeedback = document.getElementById('phone-feedback');
        const submitContainer = document.getElementById('submit-container');
        const submitBtn = document.getElementById('submit-btn');
        const statusBox = document.getElementById('status');
        const rechargeForm = document.getElementById('rechargeForm');

        // Étape 1 : Sélection du réseau
        networkBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Reset states
                networkBtns.forEach(b => b.classList.remove('border-brand-blue', 'bg-brand-blue/10'));
                
                // Active state
                btn.classList.add('border-brand-blue', 'bg-brand-blue/10');
                state.network = btn.dataset.network;
                
                // Update UI
                networkBadge.textContent = NETWORKS[state.network].name;
                step2Container.classList.add('active');
                
                // Scroll suave
                setTimeout(() => step2Container.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);

                // Reset sub-steps if already opened
                resetFromStep(2);
            });
        });

        // Étape 2 : Sélection du type de rechargement
        typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                typeBtns.forEach(b => b.classList.remove('border-brand-blue', 'bg-brand-blue/10', 'text-brand-blue'));
                
                btn.classList.add('border-brand-blue', 'bg-brand-blue/10', 'text-brand-blue');
                state.type = btn.dataset.type;
                
                resetFromStep(3);
                showLoaderAndOffers();
            });
        });

        // Étape 3 & 4 : Chargement premium et affichage dynamique
        function showLoaderAndOffers() {
            step4Container.classList.remove('active');
            step3Loader.classList.remove('hidden');
            
            // Animation premium (Simule un chargement réseau)
            setTimeout(() => {
                step3Loader.classList.add('hidden');
                renderOffers();
                step4Container.classList.add('active');
                setTimeout(() => step4Container.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
            }, 800);
        }

        function renderOffers() {
            offersGrid.innerHTML = '';
            const offers = OFFERS_DB[state.network][state.type];
            
            offers.forEach((offer, index) => {
                const card = document.createElement('div');
                card.className = `offer-card cursor-pointer border-2 border-brand-gray/30 rounded-xl p-4 hover:border-brand-blue transition-all bg-white transform translate-y-4 opacity-0`;
                card.dataset.id = offer.id;
                
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-lg text-brand-black">${offer.title}</h3>
                        <span class="text-xs font-semibold bg-brand-gray/20 text-gray-600 px-2 py-1 rounded">${offer.duration}</span>
                    </div>
                    <p class="text-brand-blue font-bold text-xl">${offer.price}</p>
                `;

                // Animation cascade d'apparition
                setTimeout(() => {
                    card.classList.remove('translate-y-4', 'opacity-0');
                }, index * 100);

                // Étape 5 : Sélection de l'offre
                card.addEventListener('click', () => {
                    document.querySelectorAll('.offer-card').forEach(c => c.classList.remove('border-brand-blue', 'ring-2', 'ring-brand-blue/20', 'bg-brand-blue/5'));
                    card.classList.add('border-brand-blue', 'ring-2', 'ring-brand-blue/20', 'bg-brand-blue/5');
                    
                    state.offer = offer;
                    
                    // Mise à jour de l'étape de validation
                    summaryTitle.textContent = `${offer.title} (${offer.duration})`;
                    summaryPrice.textContent = offer.price;
                    
                    step5Container.classList.add('active');
                    setTimeout(() => step5Container.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
                    
                    // Focus sur l'input numéro
                    setTimeout(() => phoneInput.focus(), 300);
                    validatePhoneInput(); // Revérifier si numéro déjà tapé
                });

                offersGrid.appendChild(card);
            });
        }

        // Étape 6 & 7 : Vérification de compatibilité de numéro
        phoneInput.addEventListener('input', (e) => {
            // N'autoriser que les chiffres
            let val = e.target.value.replace(/\D/g, '');
            // Limiter à 10 chiffres (format local : 0812345678)
            if(val.length > 10) val = val.slice(0, 10);
            e.target.value = val;
            state.phone = val;
            
            validatePhoneInput();
        });

        function validatePhoneInput() {
            if (!state.phone || state.phone.length === 0) {
                resetPhoneFeedback();
                return;
            }

            // Attendre qu'il y ait au moins 3 chiffres pour le préfixe
            if (state.phone.length >= 3) {
                const prefix = state.phone.substring(0, 3);
                const allowedPrefixes = NETWORKS[state.network].prefixes;
                
                if (allowedPrefixes.includes(prefix)) {
                    // Préfixe valide
                    if (state.phone.length === 10) {
                        // Numéro complet et valide
                        showPhoneSuccess(`Numéro ${NETWORKS[state.network].name} valide.`);
                        state.isValidPhone = true;
                        showSubmitButton();
                    } else {
                        // En cours de frappe mais préfixe correct
                        showPhoneNeutral(`Format en cours (Requis : 10 chiffres)`);
                        state.isValidPhone = false;
                        hideSubmitButton();
                    }
                } else {
                    // Préfixe invalide pour ce réseau
                    showPhoneError(`Attention: Ce numéro ne semble pas être un numéro ${NETWORKS[state.network].name}. Les préfixes acceptés sont : ${allowedPrefixes.join(', ')}`);
                    state.isValidPhone = false;
                    hideSubmitButton();
                }
            } else {
                resetPhoneFeedback();
                state.isValidPhone = false;
                hideSubmitButton();
            }
        }

        function resetPhoneFeedback() {
            phoneCheckIcon.classList.add('hidden');
            phoneErrorIcon.classList.add('hidden');
            phoneInput.classList.remove('border-green-500', 'border-red-500');
            phoneInput.classList.add('border-brand-gray/50');
            phoneFeedback.className = 'mt-2 text-sm text-gray-500 h-5';
            phoneFeedback.textContent = 'Veuillez entrer un numéro valide pour votre réseau.';
        }

        function showPhoneSuccess(msg) {
            phoneErrorIcon.classList.add('hidden');
            phoneCheckIcon.classList.remove('hidden');
            phoneInput.classList.remove('border-brand-gray/50', 'border-red-500');
            phoneInput.classList.add('border-green-500');
            phoneFeedback.className = 'mt-2 text-sm text-green-600 h-5 font-medium';
            phoneFeedback.textContent = msg;
        }

        function showPhoneError(msg) {
            phoneCheckIcon.classList.add('hidden');
            phoneErrorIcon.classList.remove('hidden');
            phoneInput.classList.remove('border-brand-gray/50', 'border-green-500');
            phoneInput.classList.add('border-red-500');
            phoneFeedback.className = 'mt-2 text-sm text-red-500 h-5 font-medium';
            phoneFeedback.textContent = msg;
        }

        function showPhoneNeutral(msg) {
            phoneCheckIcon.classList.add('hidden');
            phoneErrorIcon.classList.add('hidden');
            phoneInput.classList.remove('border-green-500', 'border-red-500');
            phoneInput.classList.add('border-brand-gray/50');
            phoneFeedback.className = 'mt-2 text-sm text-brand-blue h-5';
            phoneFeedback.textContent = msg;
        }

        function showSubmitButton() {
            if(state.offer) { // S'assurer qu'une offre est bien sélectionnée
                submitContainer.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
            }
        }

        function hideSubmitButton() {
            submitContainer.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
        }

        function resetFromStep(stepNum) {
            if (stepNum <= 2) {
                state.type = null;
                typeBtns.forEach(b => b.classList.remove('border-brand-blue', 'bg-brand-blue/10', 'text-brand-blue'));
            }
            if (stepNum <= 3) {
                state.offer = null;
                step4Container.classList.remove('active');
                step5Container.classList.remove('active');
                hideSubmitButton();
            }
        }

        // Étape 8 : Bouton Recharger et Appel Backend
        rechargeForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            if (!state.isValidPhone || !state.offer) return;

            // UI : Mise en état de chargement du bouton
            const originalBtnHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Traitement en cours...
            `;
            submitBtn.disabled = true;
            statusBox.classList.add('hidden');

            //Création de la commande
                try {

            const response = await fetch(
                "https://clic-omega.vercel.app:3000/api/orders",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        phone: state.phone,
                        amount: state.offer.amount,
                        network: state.network,
                        offerId: state.offer.id,
                        type: state.type
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Erreur lors de la création de la commande."
                );
            }

            showMessage(
                `Commande ${data.order.id} créée et transmise au système Mercato.`,
                true
            );

        } catch (error) {

            console.error(error);

            showMessage(
                error.message || "Impossible de contacter le serveur.",
                false
            );

        } finally {

            submitBtn.innerHTML = originalBtnHtml;
            submitBtn.disabled = false;
        }
        });

        function showMessage(msg, isSuccess) {
            statusBox.textContent = msg;
            statusBox.className = `mt-6 text-center text-sm font-medium rounded-xl p-4 animate-fade-in-up ${isSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`;
            statusBox.classList.remove('hidden');
            statusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }